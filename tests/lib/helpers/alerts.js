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

var uuid = require('uuid/v4');

var chai = require('chai');
var assert = chai.assert;

var config = require("../../test-config.json");
var oispSdk = require("@open-iot-service-platform/oisp-sdk-js");
var api = oispSdk(config).api.rest;



function getListOfAlerts(userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
    };

    api.alerts.getListOfAlerts(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            assert.notEqual(response, null, 'response is null')
            cb(null, response);
        }
    });
}

function getAlertDetails(userToken, accountId, alertId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        alertId: alertId
    };

    api.alerts.getAlertDetails(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            assert.notEqual(response, null, 'response is null')
            cb(null, response);
        }
    });
}


function closeAlert(userToken, accountId, alertId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        alertId: alertId
    };

    api.alerts.closeAlert(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            getListOfAlerts(userToken, accountId, function(err,response){
                assert.notEqual(response, null, 'response is null')
                cb(null, response);
            })  
        }
    });
}

function updateAlertStatus(userToken, accountId, alertId, status, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        alertId: alertId,
        statusName: status
    };

    api.alerts.updateAlertStatus(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            getAlertDetails(userToken, accountId, alertId, function(err,response){
                if (err) {
                    cb(err, null);
                }
                else {
                    cb(null, response);
                }
            })  
        }
    });
}

function addCommentsToAlert(userToken, accountId, alertId, comments, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        alertId: alertId,
        body: []
    };

    data.body.push(comments)

    api.alerts.addCommentsToAlert(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            cb(null, response);
        }
    });
}


function deleteAlert(userToken, accountId, alertId){
    var data = {
        userToken: userToken,
        accountId: accountId,
        alertId: alertId
    }

    return new Promise((resolve, reject) => {
	api.alerts.deleteAlert(data, function(err, response){
	    if (err){
		reject(err);
	    }
	    else {
		resolve(response);
	    }
	});
    });
}

module.exports = {
    getListOfAlerts: getListOfAlerts,
    getAlertDetails: getAlertDetails,
    closeAlert: closeAlert,
    updateAlertStatus: updateAlertStatus,
    addCommentsToAlert: addCommentsToAlert,
    deleteAlert: deleteAlert
};
