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
(function(acralyzerConfig,angular,acralyzer,acralyzerEvents) {
    "use strict";

    function BugsBrowserCtrl($scope, ReportsStore, $routeParams) {

        $scope.paginator = {
            pageSize: 30,
            currentPage: 0
        };
        $scope.pageSizeList = [15, 30, 50, 100, 500];

        $scope.previousStartKeys = [];
        $scope.startKey = null;
        $scope.nextKey = null;
        $scope.startNumber = 1;
        $scope.endNumber = $scope.paginator.pageSize;
        $scope.loading = true;

        $scope.incPage = function() {
            $scope.previousStartKeys.push($scope.startKey);
            $scope.startKey = $scope.nextKey;
            $scope.getData();
        };

        $scope.decPage = function() {
            $scope.nextKey = null;
            $scope.startKey = $scope.previousStartKeys.pop();
            $scope.getData();
        };

        $scope.isFirstPage = function() {
            return $scope.previousStartKeys.length <= 0;
        };

        $scope.isLastPage = function() {
            return $scope.nextKey === null;
        };

        $scope.firstPage = function() {
            $scope.startKey = null;
            $scope.nextKey = null;
            $scope.getData();
        };

        $scope.$watch('paginator.pageSize', function(newValue, oldValue){
            if (newValue !== oldValue) {
                $scope.firstPage();
            }
        });

        $scope.getData = function() {
//            $scope.loading = true;

            var successHandler = function(data) {
                $scope.bugs = data.rows;

                // If there are more rows, here is the key to the next page
                $scope.nextKey = data.next_row ? data.next_row.key : null;
                $scope.startNumber = ($scope.previousStartKeys.length * $scope.paginator.pageSize) + 1;
                $scope.endNumber = $scope.startNumber + $scope.bugs.length - 1;

                for(var row = 0; row < $scope.bugs.length; row++) {
                    $scope.bugs[row].latest = moment($scope.bugs[row].value.latest).fromNow();
                }
                $scope.loading = false;
            };

            var errorHandler = function(response, getResponseHeaders){
                $scope.bugs = [];
                $scope.loading = false;
            };

            ReportsStore.bugsList($scope.startKey, $scope.paginator.pageSize, successHandler, errorHandler);
        };

        $scope.$on(acralyzerEvents.LOGGED_IN, $scope.getData);
        $scope.$on(acralyzerEvents.LOGGED_OUT, $scope.getData);
        $scope.getData();
    }

    acralyzer.controller('BugsBrowserCtrl', ["$scope", "ReportsStore", "$routeParams", BugsBrowserCtrl]);

})(window.acralyzerConfig,window.angular,window.acralyzer,window.acralyzerEvents);
