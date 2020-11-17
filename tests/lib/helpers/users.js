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


function addUser(userToken, email, password, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        body: {
            email: email,
            password: password
        }
    };

    api.users.addUser(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}

function getUserInfo(userToken, userId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        userId: userId
    };

    api.users.getUserInfo(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}

function updateUserInfo(userToken, userId, userInfo, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        userId: userId,
        body: userInfo
    };

    api.users.updateUserInfo(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}

function requestUserPasswordChange(username, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        body: {
            "email":username
        }
    };

    api.users.requestUserPasswordChange(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}

function updateUserPassword(token, password, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        body:{
            token: token,
            password: password
        }
    };

    api.users.updateUserPassword(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}

function changeUserPassword(userToken, username, oldPasswd, newPasswd, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        username: username,
        userToken: userToken,
        body: {
            "currentpwd": oldPasswd,
            "password": newPasswd
        }
    };

    api.users.changeUserPassword(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}

function requestUserActivation(username, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        body:{
            email: username,
        }
    };

    api.users.requestUserActivation(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}

function activateUser(token, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        body:{
            token: token
        }
    };

    api.users.activateUser(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}


function deleteUser(userToken, userId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        deleteUserId: userId
    };

    api.users.deleteUser(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}

module.exports={
    addUser: addUser,
    getUserInfo: getUserInfo,
    updateUserInfo: updateUserInfo,
    requestUserPasswordChange: requestUserPasswordChange,
    updateUserPassword: updateUserPassword,
    changeUserPassword: changeUserPassword,
    requestUserActivation: requestUserActivation,
    activateUser: activateUser,
    deleteUser: deleteUser
};
