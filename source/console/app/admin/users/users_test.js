'use strict';

describe('serverlessVideoTranscode.admin.users spec', function() {

    var adminUsersCtrl;
    var $scope;
    var $state;
    var $blockUI;

    beforeEach(module('ui.router'));
    beforeEach(module('serverlessVideoTranscode.utils'));
    beforeEach(module('serverlessVideoTranscode.admin.users'));

    beforeEach(inject(function($controller, $rootScope, _$state_, adminUserFactory) {
        $scope = $rootScope.$new();

        $state = _$state_;
        spyOn($state, 'go');

        var users = [{
            email: 'user@amazon.com',
            name: 'Test User'
        }, {
            email: 'user2@amazon.com',
            name: 'Test User 2'
        }];

        spyOn(adminUserFactory, 'listUsers').and.callFake(function(cb) {
            cb(null, users);
        });

        $blockUI = {
            start: function() {},
            stop: function() {}
        };

        adminUsersCtrl = $controller('AdminUsersCtrl', {
            $scope: $scope,
            $state: $state,
            $blockUI: $blockUI,
            adminUserFactory: adminUserFactory
        });
    }));

    describe('cart controller', function() {

        it('should be created', function() {
            //spec body
            expect(adminUsersCtrl).toBeDefined();
            $scope.$apply();
            expect($scope.users.length).toEqual(2);
        });

    });
});
