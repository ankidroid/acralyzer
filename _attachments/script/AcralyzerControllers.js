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
(function(acralyzerConfig, acralyzer) {
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
            app: acralyzerConfig.app
        };

        /**
         * Try to log user and execute initialization when done.
         */
        $user.init();

    }

    acralyzer.controller("AcralyzerCtrl", ["$user", "$scope", "ReportsStore", "$rootScope", "$routeParams", "$http", AcralyzerCtrl]);

})(window.acralyzerConfig, window.acralyzer);
