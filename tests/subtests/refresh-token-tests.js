/**
 * Copyright (c) 2019 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*jshint esversion: 6 */
/*jshint undef: true, unused: true */
/* jshint node: true */

"use strict";

var test = function(userToken, deviceToken) {

    var chai = require('chai');
    var assert = chai.assert;
    var promtests = require('./promise-wrap');

    var oldUserRefreshToken;
    var userRefreshToken;
    var newUserToken;
    var oldDeviceRefreshToken;
    var deviceRefreshToken;
    var newDeviceToken;

    return {
    "getRefreshTokensForDeviceAndUser": function(done) {
        promtests.getRefreshToken(userToken)
        .then(response => {
            userRefreshToken = response.refreshToken;
            assert.notEqual(userRefreshToken, null, "Cannot get user refresh token.");
        }).then(() => promtests.getRefreshToken(deviceToken))
        .then(response => {
            deviceRefreshToken = response.refreshToken;
            assert.notEqual(deviceRefreshToken, null, "Cannot get device refresh token.");
        }).then(() => { done(); })
        .catch((err) => { done(err); });
    },
    "refreshTokensForDeviceAndUser": function(done) {
        promtests.refreshAuthToken(userToken, userRefreshToken)
        .then(response => {
            oldUserRefreshToken = userRefreshToken;
            userRefreshToken = response.refreshToken;
            newUserToken = response.jwt;
            assert.notEqual(userRefreshToken, null, "Device refresh token has not refreshed itself.");
            return promtests.authTokenInfo(newUserToken);
        }).then(response => {
            return promtests.refreshAuthToken(deviceToken, deviceRefreshToken);
        }).then(response => {
            oldDeviceRefreshToken = deviceRefreshToken;
            deviceRefreshToken = response.refreshToken;
            newDeviceToken = response.jwt;
            assert.notEqual(deviceRefreshToken, null, "Device refresh token has not refreshed itself.");
            return promtests.refreshAuthToken(newDeviceToken, oldDeviceRefreshToken)
                .then(() => {
                    throw "Old refresh token can still be used."
                }).catch(err => {
                    Promise.resolve();
                });
        }).then(() => { done(); })
    },
    "revokeRefreshToken": function(done) {
        promtests.revokeRefreshToken(deviceToken, deviceRefreshToken)
        .then(response => {
            return promtests.refreshAuthToken(newDeviceToken, deviceRefreshToken)
                .then(() => {
                    throw "Revoked refresh token can still be used."
                }).catch(err => {
                    Promise.resolve();
                });
        }).then(() => { done(); });
    },
    "cleanup": function(done) {
        promtests.revokeRefreshToken(newUserToken, userRefreshToken)
        .then(() => { done(); });
    }
    };
};

var descriptions = {
    "getRefreshTokensForDeviceAndUser": "Create a refresh token for given device and user",
    "refreshTokensForDeviceAndUser": "Use refresh token to get new JWT tokens for device and user",
    "revokeRefreshToken": "Revoke a refresh token and test if it can be still used",
    "cleanup": "Cleanup refresh tokens"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
