/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.service.auth', ['serverlessVideoTranscode.utils'])
    .service('authService', function($q, $_, $localstorage, $location, $resource) {
        if (FEDERATED_LOGIN) {
        } else {
            this.poolData = {
                UserPoolId: YOUR_USER_POOL_ID,
                ClientId: YOUR_USER_POOL_CLIENT_ID,
                Paranoia: 8
            };
        }

        var forgotPasswordResource = function() {
            var _url = [APIG_ENDPOINT, 'admin/users/:userId/forgotPassword'].join('/');
            return $resource(_url, {
                userId: '@id'
            }, {
                forgotPassword: {
                    method: 'POST',
                    headers: {}
                }
            });
        };

        var userResource = function(token) {
            var _url = [APIG_ENDPOINT, 'admin/users/:userId'].join('/');
            return $resource(_url, {
                userId: '@id'
            }, {
                get: {
                    method: 'GET',
                    headers: {
                        Auth: token
                    }
                }
            });
        };

        this.signup = function(newuser) {
            var deferred = $q.defer();

            if (FEDERATED_LOGIN) {
                deferred.reject("Function not valid for federated login");
                return deferred.promise;
            }

            newuser.username = newuser.email.replace('@', '_').replace(/\./g, '_').toLowerCase();

            var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
            var attributeList = [];

            var dataEmail = {
                Name: 'email',
                Value: newuser.email.toLowerCase()
            };

            var dataName = {
                Name: 'name',
                Value: newuser.name
            };

            var dataDisplayName = {
                Name: 'custom:display_name',
                Value: newuser.name
            };

            var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataEmail);
            var attributeName = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataName);
            var attributeDisplayName = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(
                dataDisplayName);

            attributeList.push(attributeEmail);
            attributeList.push(attributeName);
            attributeList.push(attributeDisplayName);

            userPool.signUp(newuser.username, newuser.password, attributeList, null, function(err, result) {
                if (err) {
                    console.log(err);
                    deferred.reject(err.message);
                } else {
                    deferred.resolve(result.user);
                }
            });

            return deferred.promise;

        };

        this.newPassword = function(newuser) {
            var deferred = $q.defer();

            if (FEDERATED_LOGIN) {
                deferred.reject("Function not valid for federated login");
                return deferred.promise;
            }

            newuser.username = newuser.email.replace('@', '_').replace(/\./g, '_').toLowerCase();

            var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
            var userData = {
                Username: newuser.username,
                Pool: userPool
            };
            var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

            return deferred.promise;
        };

        this.forgot = function(user) {
            var deferred = $q.defer();

            if (FEDERATED_LOGIN) {
                deferred.reject("Function not valid for federated login");
                return deferred.promise;
            }

            var _username = user.email.replace('@', '_').replace(/\./g, '_').toLowerCase();
            forgotPasswordResource().forgotPassword({
                userId: _username
            }, {}, function(data) {
                deferred.resolve(data.code);

            }, function(err) {
                deferred.reject("Failed to process forgot request.");
            });

            return deferred.promise;
        };

        this.resetPassword = function(user) {
            var deferred = $q.defer();

            if (FEDERATED_LOGIN) {
                deferred.reject("Function not valid for federated login");
                return deferred.promise;
            }

            var _username = user.email.replace('@', '_').replace(/\./g, '_').toLowerCase();
            var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
            var userData = {
                Username: _username,
                Pool: userPool
            };
            var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
            cognitoUser.confirmPassword(user.verificationCode, user.password, {
                onSuccess: function(result) {
                    deferred.resolve();
                },
                onFailure: function(err) {
                    console.log(err);
                    var _msg = err.message;
                    deferred.reject(_msg);
                }
            });

            return deferred.promise;
        };

        this.changePassword = function(oldpassword, newpassword) {
            var deferred = $q.defer();

            if (FEDERATED_LOGIN) {
                deferred.reject("Function not valid for federated login");
                return deferred.promise;
            }

            var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
            var cognitoUser = userPool.getCurrentUser();
            cognitoUser.getSession(function(err, session) {
                if (err) {
                    console.log(err);
                    var _msg = err.message;
                    deferred.reject(_msg);
                } else {
                    cognitoUser.changePassword(oldpassword, newpassword, function(err, result) {
                        if (err) {
                            console.log(err);
                            var _msg = err.message;
                            deferred.reject(_msg);
                        } else {
                            deferred.resolve(result);
                        }

                    });
                }
            });

            return deferred.promise;
        };

        this.signin = function(user, authAction) {
            var deferred = $q.defer();

            try {
                if (FEDERATED_LOGIN) {
                    deferred.resolve(true);
                    return deferred.promise;
                }else{
                    deferred.resolve(true);
                }


                var authenticationData = {
                    Username: user.email.toLowerCase(),
                    Password: user.password,
                };
                var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(
                    authenticationData);
                var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
                var userData = {
                    Username: user.email.toLowerCase(),
                    Pool: userPool
                };
                var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

                cognitoUser.authenticateUser(authenticationDetails, {
                    onSuccess: function(result) {
                        $localstorage.set('username', cognitoUser.getUsername());
                        deferred.resolve({
                            state: 'login_success',
                            result: result
                        });
                    },

                    onFailure: function(err) {
                        console.log(err);
                        deferred.reject(err);
                    },
                    newPasswordRequired: function(userAttributes, requiredAttributes) {
                        if (authAction === 'password_challenge') {
                            cognitoUser.completeNewPasswordChallenge(user.newPassword, [], {
                                onSuccess: function(result) {
                                    deferred.resolve();
                                },
                                onFailure: function(err) {
                                    console.log(err);
                                    var _msg = err.message;
                                    deferred.reject(_msg);
                                }
                            });
                        } else {
                            deferred.resolve({
                                state: 'new_password_required',
                                result: {
                                    userAttributes: userAttributes,
                                    requiredAttributes: requiredAttributes
                                }
                            });
                        }
                    }
                });
            } catch (e) {
                console.log(e);
                deferred.reject(e);
            }

            return deferred.promise;
        };

        this.signOut = function() {
            try {
                if (FEDERATED_LOGIN) {
                    window._keycloak.logout();
                    return true;
                } else {
                    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
                    var cognitoUser = userPool.getCurrentUser();
                    if (cognitoUser != null) {
                        cognitoUser.signOut();
                        return true;
                    } else {
                        return false;
                    }
                }

            } catch (e) {
                console.log(e);
                return false;
            }
        };

        this.isAuthenticated = function() {
            var deferred = $q.defer();
            try {

                if (FEDERATED_LOGIN) {
                  deferred.resolve(true);
                } else {
                    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
                    var cognitoUser = userPool.getCurrentUser();
                    if (cognitoUser != null) {
                        cognitoUser.getSession(function(err, session) {
                            if (err) {
                                deferred.resolve(false);
                            } else {
                                deferred.resolve(true);
                            }
                        });
                    } else {
                        deferred.resolve(false);
                    }
                }

            } catch (e) {
                console.log(e);
                deferred.resolve(false);
            }

            return deferred.promise;
        };

        this.isAdminAuthenticated = function() {
            var deferred = $q.defer();

            this.getUserInfo().then(function(result) {
                deferred.resolve(result.role.toLowerCase() == 'admin');
            }, function(msg) {
                deferred.reject("Failed to retrieve session data");
            });

            return deferred.promise;
        };

        this.logOut = function() {
            this.signOut();
        };

        this.getUserAccessToken = function() {
            var deferred = $q.defer();

            if (FEDERATED_LOGIN) {
              deferred.resolve({jwtToken: "testToken"});
            } else {
              deferred.resolve('asdfasdfasdfasdf');
            }

            return deferred.promise;
        };

        this.getUserAccessTokenWithUsername = function() {
            var deferred = $q.defer();

            var username = this.getUsername();
            this.getUserAccessToken().then(function(token) {
                deferred.resolve({
                    token: token,
                    username: username
                });
            }, function(msg) {
                deferred.reject("Failed to retrieve session data");
            });

            return deferred.promise;
        };

        this.getUsername = function() {
            let user_name = '';

            if (FEDERATED_LOGIN) {
              user_name = localStorage.getItem('keycloak_username');
            } else {
                var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
                var cognitoUser = userPool.getCurrentUser();
                if (cognitoUser != null) {
                    user_name = cognitoUser.getUsername();
                }
            }

            return user_name;
        };

        this.getUserInfo = function() {
            var deferred = $q.defer();
            this.getUserAccessToken().then(function(token) {
                var _token = ['tk:', token.jwtToken].join('');
                    var userinfo = {
                        email: "test@amazon.com",
                        name: "test",
                        username: "test",
                        display_name: "testUser",
                        accesskey: "****",
                        role: "Admin"
                    };
                deferred.resolve(userinfo);
            }, function(msg) {
                deferred.reject("Failed to retrieve session data");
            });

            return deferred.promise;
        };

    });
