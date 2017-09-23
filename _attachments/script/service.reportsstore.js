/*
 Copyright 2013 Kevin Gaudin (kevin.gaudin@gmail.com)

 This file is part of Acralyzer.

 Acralyzer is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Acralyzer is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with Acralyzer.  If not, see <http://www.gnu.org/licenses/>.
 */
(function(acralyzerConfig,angular,acralyzerEvents,acralyzer,hex_md5,Showdown) {
    "use strict";

    /**
     * Reports storage access module.
     *
     * @class ReportsStore
     * @singleton
     * @static
     */
    acralyzer.factory('ReportsStore', ['$rootScope', '$http', '$resource', function($rootScope, $http, $resource) {

        var dbName = acralyzerConfig.appDBPrefix + acralyzerConfig.app;

        // ReportsStore service instance
        var ReportsStore = {
            dbName: dbName,
            views: $resource(acralyzerConfig.urlPrefix + '/' + dbName + '/_design/acra-storage/_view/:view'),
            details: $resource(acralyzerConfig.urlPrefix + '/' + dbName + '/:reportid'),
            bug: $resource(acralyzerConfig.urlPrefix + '/' + dbName + '/:bugid', { bugid: '@_id' }, { save: {method: 'PUT'}})
        };

        // Markdown converter
        var converter = new Showdown.converter({extensions:['github','table']});

        // Key: report ID Value: report digest
        ReportsStore.reportsList = function(startKey, reportsCount, includeDocs, cb, errorHandler) {
            var viewParams = {
                view: 'recent-items',
                descending: true,
                limit: reportsCount + 1,
                include_docs: includeDocs
            };
            if(startKey !== null) {
                viewParams.startkey = '"' + startKey + '"';
            }

            var additionalCallback = function(data) {
                if(data.rows && (data.rows.length > reportsCount)) {
                    data.next_row = data.rows.splice(reportsCount,1)[0];
                }
                for(var row = 0; row < data.rows.length; row++) {
                    data.rows[row].displayDate = moment(data.rows[row].key).fromNow();
                }
                cb(data);
            };
            return ReportsStore.views.get(viewParams, additionalCallback, errorHandler);
        };

        // Key: report ID Value: report digest
        ReportsStore.filteredReportsList = function(filterName, filterValue, pageStartKey, reportsCount, includeDocs, cb, errorHandler) {
            var viewParams = {
                view: 'recent-items-by-' + filterName,
                descending: true,
                limit: reportsCount + 1,
                include_docs: includeDocs,
                reduce: false
            };

            if(filterName.indexOf("bug") === 0) {
                // Bugs have composite keys, already an array.
                viewParams.endkey = JSON.stringify(filterValue);
                var startKeyValue = filterValue.slice(0);
                startKeyValue.push({});
                viewParams.startkey = JSON.stringify(startKeyValue);
            } else {
                viewParams.endkey = JSON.stringify([filterValue]);
                viewParams.startkey = JSON.stringify([filterValue,{}]);
            }

            if(pageStartKey !== null) {
                viewParams.startkey = JSON.stringify(pageStartKey);
            }

            var additionalCallback = function(data) {
                if(data.rows && (data.rows.length > reportsCount)) {
                    data.next_row = data.rows.splice(reportsCount,1)[0];
                }

                for(var row = 0; row < data.rows.length; row++) {
                    if(filterName === "bug") {
                        data.rows[row].displayDate = moment(data.rows[row].key[3]).fromNow();
                    } else if(filterName === "bug-by-installation-id") {
                        data.rows[row].displayDate = moment(data.rows[row].key[4]).fromNow();
                    } else {
                        data.rows[row].displayDate = moment(data.rows[row].key[1]).fromNow();
                    }
                }

                cb(data);
            };

            return ReportsStore.views.get(viewParams, additionalCallback, errorHandler);
        };

        // 1 full report
        ReportsStore.reportDetails = function(id, cb) {
            return ReportsStore.details.get({reportid: id}, cb);
        };

        ReportsStore.appVersionsList = function(cb) {
            return ReportsStore.views.get({view: 'recent-items-by-appver', group_level: 1}, cb);
        };

        ReportsStore.androidVersionsList = function(cb) {
            return ReportsStore.views.get({view: 'recent-items-by-androidver', group_level: 1}, cb);
        };

        // BUGS MANAGEMENT
        var computeBugId = function(bug) {
            if (bug.id) {
                return bug.id;
            } else {
                return hex_md5(bug.key[0] + "|" + bug.key[1] + "|" + bug.key[2]);
            }
        };

        ReportsStore.bugsList = function(cb, errorHandler) {
            var viewParams = {
                view: 'bugs',
                descending: true,
                group: true
            };

            var bugEqualityTest = function(bug2) {
                if(this.value.latest !== bug2.value.latest ||
                    this.value.count !== bug2.value.count ||
                    this.value.solved !== bug2.value.solved ||
                    this.value.description !== bug2.value.description) {
                    return false;
                }
                return true;
            };

            var bugUpdate = function(bug2) {
                if(this.value.latest !== bug2.value.latest) {
                    this.value.latest = bug2.value.latest;
                }
                if(this.value.count !== bug2.value.count) {
                    this.value.count = bug2.value.count;
                }
                if(this.value.solved !== bug2.value.solved) {
                    this.value.solved = bug2.value.solved;
                }
                if(this.value.description !== bug2.value.description) {
                    this.value.description = bug2.value.description;
                }
            };

            var toggleSolved = function() {
                var bug = this;
                this.solvedPending = true;
                ReportsStore.toggleSolvedBug(bug, function(data){
                    bug.solvedPending = false;
                });
            };

            var additionalCallback = function(data) {
                // The bug view does not return individual documents. Unless data has been specifically updated about
                // one bug, there is no bug document in a database. We add here the computed id of each 'virtual' bug.
                for (var i = 0; i < data.rows.length; i++) {
                    data.rows[i].id = computeBugId(data.rows[i]);
                    data.rows[i].equals = bugEqualityTest;
                    data.rows[i].updateWithBug = bugUpdate;
                    data.rows[i].toggleSolved = toggleSolved;
                    data.rows[i].descriptionHtml = converter.makeHtml(data.rows[i].value.description);
                }
                cb(data);
            };

            return ReportsStore.views.get(viewParams, additionalCallback, errorHandler);
        };

        ReportsStore.toggleSolvedBug = function(bug, callback) {
            var curBug = ReportsStore.bug.get({ bugid: bug.id}, function() {
                // Success callback
                curBug.solved = ! curBug.solved;
                var state = curBug.solved;
                curBug.$save(function(data) {
                    bug.value.solved = state;
                    console.log("bug is now:");
                    console.log(bug);
                    callback(data);
                });
            }, function() {
                // Fail callback
                curBug = new ReportsStore.bug(
                    {
                        _id: bug.id,
                        APP_VERSION_CODE: bug.key[0],
                        digest: bug.key[1],
                        rootCause: bug.key[2],
                        solved: true,
                        type: "solved_signature"
                    });
                curBug.$save(function(data) {
                    bug.value.solved = curBug.solved;
                    callback(data);
                });
            });
        };

        ReportsStore.saveBug = function(bug, callback) {
            var curBug = ReportsStore.bug.get({ bugid: bug.id}, function() {
                curBug.description = bug.value.description;
                curBug.$save(callback);
            }, function() {
                // Fail callback
                curBug = new ReportsStore.bug(
                    {
                        _id: bug.id,
                        APP_VERSION_CODE: bug.key[0],
                        digest: bug.key[1],
                        rootCause: bug.key[2],
                        solved: bug.value.solved,
                        type: "solved_signature",
                        description: bug.value.description
                    });
                curBug.$save(callback);
            });
        };

        ReportsStore.deleteReport = function(report, cb) {
            var reportToDelete = ReportsStore.details.get({reportid: report.id}, function() {
                ReportsStore.details.remove({reportid: report.id, rev: reportToDelete._rev}, cb);
            });
        };

        /**
         * Gets a single bug from its Id.
         * @param bugId
         * @param cb
         */
        ReportsStore.getBugForId = function(bugId, cb) {
            var bug = {};
            ReportsStore.bugsList(function(data) {
                console.log("looking for bug with id " + bugId);
                for (var i = 0; i < data.rows.length; i++) {
                    if (data.rows[i].id === bugId) {
                        bug = data.rows[i];
                        console.log("Bug found:");
                        console.log(bug);
                        break;
                    }
                }
                cb(bug);
            });
            return bug;
        };

        ReportsStore.getUsersForBug = function(bug, cb) {
            var viewParams = {
                view: 'users-per-bug',
                reduce: true,
                group_level: 4
            };

            viewParams.startkey = JSON.stringify([bug.key[0], bug.key[1], bug.key[2]]);
            viewParams.endkey = JSON.stringify([bug.key[0], bug.key[1], bug.key[2], {}]);
            var result = [];
            ReportsStore.views.get(viewParams,function(data) {
                for(var row = 0; row < data.rows.length; row++) {
                    var user = {
                        installationId: data.rows[row].key[3],
                        reportsCount: data.rows[row].value
                    };
                    result.push(user);
                }
                if(cb) {
                    cb(result);
                }
            });
            return result;
        };

        return ReportsStore;
    }]);

})(window.acralyzerConfig,window.angular,window.acralyzerEvents,window.acralyzer,window.hex_md5,window.Showdown);
