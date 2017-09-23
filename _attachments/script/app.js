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
(function(acralyzerConfig, angular, $, acralyzerEvents, prettyPrint) {
    "use strict";

    var acralyzer = window.acralyzer = angular.module('Acralyzer', ['ui.bootstrap', 'ngResource']);

    acralyzer.config(['$routeProvider', function($routeProvider) {
        $routeProvider.
            when('/reports-browser/:app', {templateUrl: 'partials/reports-browser.html', controller: 'ReportsBrowserCtrl', activetab: "reports-browser"}).
            when('/reports-browser/:app/bug/:bugId', {templateUrl: 'partials/reports-browser.html', controller: 'ReportsBrowserCtrl', activetab: "reports-browser"}).
            when('/reports-browser/:app/user/:installationId', {templateUrl: 'partials/reports-browser.html', controller: 'ReportsBrowserCtrl', activetab: "reports-browser"}).
            when('/bugs-browser/:app', {templateUrl: 'partials/bugs-browser.html', controller: 'BugsBrowserCtrl', activetab: "bugs-browser"}).
            when('/report-details/:app/:reportId', {templateUrl: 'partials/report-details.html', controller: 'ReportDetailsCtrl', activetab: "none"}).
            otherwise({redirectTo: '/reports-browser/'});
    }]);

    acralyzer.directive('prettyprint',function(){
            return {
                restrict: 'A',
                link:function($scope,$element,$attr){
                    // Persistent container for json output
                    var $json = $('<div>');
                    $element.prepend($json);

                    $attr.$observe('prettyprint',function(value){

                        var dopp = function (inspect){
                            // Replace contents of persistent json container with new json table
                            $json.empty();
                            $json.append(prettyPrint(inspect, {
                                // Config
                                //                            maxArray: 20, // Set max for array display (default: infinity)
                                expanded: false, // Expanded view (boolean) (default: true),
                                maxDepth: 5, // Max member depth (when displaying objects) (default: 3)
                                sortKeys: true,
                                stringsWithDoubleQuotes: false,
                                classes: {
                                    'default': {
                                        table: "none",
                                        th: "none"
                                    }
                                }
                            }));
                        };

                        if (value !== '') {
                            // Register watcher on evaluated expression
                            $scope.$watch(function watcher(){
                                return $scope.$eval(value);
                            },dopp,true);
                        } else {
                            // Watch entire scope
                            $scope.$watch(dopp);
                        }

                    });
                }
            };
        });

    acralyzer.directive('reportDetails', function() {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                acralyzer: '='
            },
            templateUrl: 'partials/report-details.html'
        };
    });

    acralyzer.directive('bugDetails', function() {
        return {
            restrict: 'E',
            scope: {
                bug: '=',
                acralyzer: '='
            },
            templateUrl: 'partials/bug-details.html',
            controller: ['$scope', '$element', '$attrs', '$transclude', 'ReportsStore', function($scope, $element, $attrs, $transclude, ReportsStore) {
                console.log("In the controller for bugDetails with scope:");
                $scope.nbUsersToDisplay = 10;
                $scope.selectedUser = {};
                $scope.incNbUsersToDisplay = function(nb) {
                    $scope.nbUsersToDisplay += nb;
                };
                $scope.selectUser = function(user) {
                    if($scope.selectedUser.installationId !== user.installationId) {
                        $scope.selectedUser = user;
                        $scope.$parent.filterWithUser(user);
                    } else {
                        $scope.selectedUser = {};
                        $scope.$parent.filterWithUser(null);
                    }
                };
                $scope.$watch('bug', function(newValue, oldValue) {
                    if(newValue) {
                        $scope.users = ReportsStore.getUsersForBug(newValue);
                    }
                });
            }]
        };
    });

    /* http://www.frangular.com/2012/12/pagination-cote-client-directive-angularjs.html */
    acralyzer.directive('paginator', function () {
        var pageSizeLabel = "Page size";
        return {
            priority: 0,
            restrict: 'A',
            scope: {items: '&'},
            templateUrl: 'partials/paginator.html',
            replace: false,
            compile: function compile(tElement, tAttrs, transclude) {
                return {
                    pre: function preLink(scope, iElement, iAttrs, controller) {
                        scope.pageSizeList = [15, 30, 50, 100, 500];
                        scope.paginator = {
                            pageSize: 100,
                            currentPage: 0
                        };

                        scope.isFirstPage = function () {
                            return scope.paginator.currentPage === 0;
                        };
                        scope.isLastPage = function () {
                            return scope.paginator.currentPage >= scope.items().length / scope.paginator.pageSize - 1;
                        };
                        scope.incPage = function () {
                            if (!scope.isLastPage()) {
                                scope.$parent.setNextPageAnimation();
                                scope.paginator.currentPage++;
                            }
                        };
                        scope.decPage = function () {
                            if (!scope.isFirstPage()) {
                                scope.$parent.setPreviousPageAnimation();
                                scope.paginator.currentPage--;
                            }
                        };
                        scope.firstPage = function () {
                            scope.paginator.currentPage = 0;
                        };
                        scope.numberOfPages = function () {
                            return Math.ceil(scope.items().length / scope.paginator.pageSize);
                        };
                        scope.$watch('paginator.pageSize', function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                scope.firstPage();
                            }
                        });

                        // ---- Functions available in parent scope -----

                        scope.$parent.firstPage = function () {
                            scope.firstPage();
                        };
                        // Function that returns the reduced items list, to use in ng-repeat
                        scope.$parent.pageItems = function () {
                            var start = scope.paginator.currentPage * scope.paginator.pageSize;
                            var limit = scope.paginator.pageSize;
                            return scope.items().slice(start, start + limit);
                        };

                        scope.$parent.firstItemIndex = function() {
                            return scope.paginator.currentPage * scope.paginator.pageSize + 1;
                        };

                        scope.$parent.lastItemIndex = function() {
                            var nbItemsInPage = scope.paginator.pageSize;
                            if(scope.isLastPage()) {
                                nbItemsInPage = scope.items().length % scope.paginator.pageSize;
                            }
                            return scope.paginator.currentPage * scope.paginator.pageSize + nbItemsInPage;
                        };
                    },
                    post: function postLink(scope, iElement, iAttrs, controller) {}
                };
            }
        };
    });
})(window.acralyzerConfig, window.angular, window.jQuery, window.acralyzerEvents, window.prettyPrint);
