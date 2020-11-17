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

var test = function(username, password, userToken, accountId, deviceId) {

    var chai = require('chai');
    var assert = chai.assert;
    var promtests = require('./promise-wrap');

    var oldUserToken;
    var oldDeviceToken;
    var userRefreshToken;
    var newUserToken;
    var deviceRefreshToken;
    var newDeviceToken;

    return {
        "getRefreshTokensForDeviceAndUser": function(done) {
            promtests.authGetToken(username, password)
                .then(response => {
                    userRefreshToken = response.refreshToken;
                    oldUserToken = response.token;
                    assert.notEqual(userRefreshToken, null, "Cannot get user refresh token.");
                }).then(() => promtests.activateDevice(oldUserToken, accountId, deviceId))
                .then(response => {
                    deviceRefreshToken = response.refreshToken;
                    oldDeviceToken = response.deviceToken;
                    assert.notEqual(deviceRefreshToken, null, "Cannot get device refresh token.");
                }).then(() => { done(); })
                .catch((err) => { done(err); });
        },
        "refreshTokensForDeviceAndUser": function(done) {
            promtests.refreshAuthToken(oldUserToken, userRefreshToken)
                .then(response => {
                    newUserToken = response.jwt;
                    return promtests.authTokenInfo(newUserToken);
                }).then(response => {
                    if (!response) {
                        done('Could not get refreshed user token info: ' + response);
                    }
                    return promtests.refreshAuthToken(oldDeviceToken, deviceRefreshToken);
                }).then(response => {
                    newDeviceToken = response.jwt;
                    return promtests.authTokenInfo(newDeviceToken);
                }).then((response) => {
                    if (response) {
                        done();
                    } else {
                        done('Could not get refreshed device token info: ' + response);
                    }
                });
        }
    };
};

var descriptions = {
    "getRefreshTokensForDeviceAndUser": "Create a refresh token for given device and user",
    "refreshTokensForDeviceAndUser": "Use refresh token to get new JWT tokens for device and user"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
