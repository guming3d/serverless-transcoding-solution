'use strict';

describe('serverlessVideoTranscode.dashboard module', function() {

    var dashboardCtrl;
    var $scope;
    var $state;
    var $localStorage;

    beforeEach(module('ui.router'));
    beforeEach(module('serverlessVideoTranscode.utils'));
    beforeEach(module('serverlessVideoTranscode.dashboard'));

    beforeEach(inject(function($controller, $rootScope, _$state_) {
        $scope = $rootScope.$new(); //get a childscope

        $state = _$state_;
        spyOn($state, 'go');

        dashboardCtrl = $controller('DashboardCtrl', {
            $scope: $scope,
            $state: $state,
            $localStorage: $localStorage
        }); //Pass it as argument as $scope's value
    }));

    describe('dashboard controller', function() {

        it('should be created', function() {
            //spec body
            expect(dashboardCtrl).toBeDefined();
            $scope.$apply();
            expect($scope.showIntroModal).toEqual(false);
        });

        it('should change state to search when searching', function() {

            $scope.search('test');
            expect($state.go).toHaveBeenCalledWith('search', {
                terms: 'test'
            });

        });

    });
});
