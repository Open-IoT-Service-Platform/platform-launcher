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


function createInvitation(userToken, accountId, receiveremail, cb){
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: {
            email: receiveremail
        }
    };

    api.invitation.createInvitation(data, function(err, response) {
        assert.notEqual(response, null, 'response is null');
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });
}


function getAllInvitations(userToken, accountId, cb){
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.invitation.getAllInvitations(data, function(err, response) {
        assert.notEqual(response, null, 'response is null');
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });
}

function getInvitations(userToken, accountId, email, cb){
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        email: email
    };

    api.invitation.getInvitations(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });
}

function acceptInvitation(userToken, accountId, inviteId, cb){
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        inviteId: inviteId,
        body: {
            accept: true
        }
    };

    api.invitation.acceptInvitation(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });
}

function deleteInvitations(userToken, accountId, receiveremail, cb){
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        email: receiveremail
    };

    api.invitation.deleteInvitations(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });
}

module.exports={
    createInvitation: createInvitation,
    getAllInvitations: getAllInvitations,
    getInvitations: getInvitations,
    acceptInvitation: acceptInvitation,
    deleteInvitations: deleteInvitations
};
