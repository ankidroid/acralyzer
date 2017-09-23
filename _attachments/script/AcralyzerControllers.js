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
(function(acralyzerConfig,angular,acralyzer,acralyzerEvents,$) {
    "use strict";
    /**
     * @class AcralyzerCtrl
     *
     * Application root controller, handles global behavior such as login logout and reports store change.
     *
     */
    function AcralyzerCtrl($user, $scope, ReportsStore, $rootScope, $routeParams, $http) {

        /**
         * Application scope, visible to children scopes with $scope.acralyzer.
         * @type {Object}
         */
        $scope.acralyzer = {
            apps: []
        };
        $scope.acralyzer.app = null;

        ReportsStore.listApps(function(data) {
            console.log("Storage list retrieved.");
            $scope.acralyzer.apps.length = 0;
            $scope.acralyzer.apps = data;
            console.log($scope.acralyzer.apps);
        }, function() {

        });

        var onUserLogin = function() {

            if(!($routeParams.app)){
                $scope.acralyzer.setApp(acralyzerConfig.defaultApp);
            }

        };

        /**
         * Switch to another reports store.
         * @param {String} appName The name of the chosen android application (reports store database without database
         * prefix)
         */
        $scope.acralyzer.setApp = function(appName) {
            console.log("Setting app to ", appName);
            if(!appName) {
                appName = $scope.acralyzer.apps[0];
                console.log("Override setting undefined app to ", appName);
            }
            if(appName !== $scope.acralyzer.app) {
                $scope.acralyzer.app = appName;
                ReportsStore.setApp($scope.acralyzer.app,
                    function() {
                        console.log("broadcasting APP_CHANGED");
                        $rootScope.$broadcast(acralyzerEvents.APP_CHANGED);
                    }
                );
            }
        };

        $scope.$on(acralyzerEvents.LOGGED_IN, onUserLogin);

        /**
         * Try to log user and execute initialization when done. onUserLogin() will be triggered by LOGGED_IN broadcast
         * event.
         */
        $user.init();

    }
    acralyzer.controller('AcralyzerCtrl', ["$user", "$scope", "ReportsStore", "$rootScope", "$routeParams", "$http", AcralyzerCtrl]);
})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents,window.jQuery);
