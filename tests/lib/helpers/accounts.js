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



function createAccount(name, userToken, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        body: {
            name: name
        }
    };

    api.accounts.createAccount(data, function(err, response) {
        if (!err) {
            assert.isString(response.id, "Account id not returned");
            cb(null, response);
        }
        else {
            cb(err);
        }
    });
}

function getAccountInfo(accountId, userToken, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.accounts.getAccountInfo(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null, response);
        }
        else {
            cb(err);
        }
    });
}

function updateAccount(accountId, userToken, newAccountInfo, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: newAccountInfo
    };

    api.accounts.updateAccount(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null, response);
        }
        else {
            cb(err);
        }
    });
}

function getAccountActivationCode(accountId, userToken, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.accounts.getAccountActivationCode(data, function(err, response) {
        if(!err){
            assert.notEqual(response.activationCode, null ,'activation code is null');
            cb(null,response);
        }
        else{
            cb(err);
        }
    });
}

function refreshAccountActivationCode(accountId, userToken, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.accounts.refreshAccountActivationCode(data, function(err, response) {
        if(!err){
            assert.notEqual(response.activationCode, null ,'activation code is null');
            cb(null,response);
        }
        else{
            cb(err);
        }
    });
}

function getAccountUsers(accountId, userToken, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.accounts.getAccountUsers(data, function(err, response) {
        assert.notEqual(response, null ,'user list is null');
        cb(err, response);
    });
}

function changeAccountUser(accountId, userToken, userId,  cb) {
    if (!cb) {
        throw "Callback required";
    }


    var data = {
        userToken: userToken,
        accountId: accountId,
        userId: userId,
        body:{
            id: userId,
            accounts:{}
        }
    };

    data.body.accounts[accountId] = 'admin';

    api.accounts.changeAccountUser(data, function(err, response) {
        assert.notEqual(response, null, 'response is null');
        cb(err, response);
    });
}

function deleteAccount(userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.accounts.deleteAccount(data, function(err, response) {
        if (!err) {
            assert.notEqual(response, null, 'response is null');
            cb(null,response);
        }
        else {
            cb(err);
        }
    });
}

module.exports = {
    getAccountActivationCode: getAccountActivationCode,
    refreshAccountActivationCode: refreshAccountActivationCode,
    getAccountUsers: getAccountUsers,
    changeAccountUser: changeAccountUser,
    createAccount: createAccount,
    getAccountInfo: getAccountInfo,
    updateAccount: updateAccount,
    deleteAccount: deleteAccount
};
