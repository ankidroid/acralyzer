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

(function(acralyzerConfig,angular,acralyzer,acralyzerEvents,location,moment) {
    "use strict";

    function AdminCtrl($scope, ReportsStore, $routeParams, $notify, $user, $http) {
        if($routeParams.app) {
            console.log("ReportsBrowser: Direct access to app " + $routeParams.app);
            $scope.acralyzer.setApp($routeParams.app);
        } else {
            console.log("ReportsBorwser: Access to default app " + acralyzerConfig.defaultApp);
            $scope.acralyzer.setApp(acralyzerConfig.defaultApp);
        }

        ReportsStore.appVersionCodesList(function(data){
            $scope.appVersionCodes.length = 0;
            for(var row = 0; row < data.rows.length; row++) {
                $scope.appVersionCodes.push({value:data.rows[row].key[0], label:data.rows[row].key[0]});
            }
        });

        // USER PREFERENCES
        $scope.acralyzerConfig = acralyzerConfig;
        $scope.apps = [];
        ReportsStore.listApps(function(appsList) {
            $scope.apps = appsList;
        });
    }
    acralyzer.controller('AdminCtrl', ["$scope", "ReportsStore", "$routeParams", "$notify", "$user", "$http", AdminCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents,window.location,window.moment);
