/**
 * Copyright (c) 2017 Intel Corporation
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


"use strict";

var chai = require('chai');
var assert = chai.assert;

var config = require("../../test-config.json");
var oispSdk = require("@open-iot-service-platform/oisp-sdk-js");
var api = oispSdk(config).api.rest;


function login(username, password, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        body: {
            username: username,
            password: password
        }
    };

    api.auth.getAuthToken(data, function(err, response) {
        var grant = {};

        if (!err) {
            assert.isString(response.token, "no access token retrieved");
            assert.isString(response.refreshToken, "no refresh token retrieved");
            assert.isString(response.idToken, "no id token retrieved");
            grant.token = response.token;
            grant.refreshToken = response.refreshToken;
            grant.idToken = response.idToken;
        }
        cb(err, grant);
    });
}


function tokenInfo(token, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken:token
    };

    api.auth.getAuthTokenInfo(data, function(err, response) {
        if (!err) {
            assert.equal(response.header.typ,'JWT', "response header type error");
        }
        cb(err, response);
    });
}

function userInfo(token, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken:token
    };

    api.auth.getAuthUserInfo(data, function(err, response) {
        if (!err) {
            assert.isString(response.id, "no access token retrieved");
        }
        cb(err, response);
    });
}

function refreshAuthToken(oldToken, refreshToken, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        token: oldToken,
        body: {
            refreshToken: refreshToken
        }
    };

    api.auth.refreshAuthToken(data, function(err, response) {
        cb(err, response);
    });
}

module.exports = {
    login: login,
    refreshAuthToken: refreshAuthToken,
    userInfo: userInfo,
    tokenInfo: tokenInfo
};
