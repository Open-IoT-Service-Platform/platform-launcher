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

//-------------------------------------------------------------------------------------------------------
// Helper Functions
//-------------------------------------------------------------------------------------------------------

var chai = require('chai');
var assert = chai.assert;

var config = require("../../test-config.json");
var oispSdk = require("@open-iot-service-platform/oisp-sdk-js");
var api = oispSdk(config).api.rest;


function sendActuationCommand(paramName, value, userToken, accountId, actuatorId, deviceId, cb){
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: {
            commands: [{
                componentId: actuatorId,
                transport: "ws",
                parameters: [{
                    name: paramName,
                    value: value.toString()
                }]
            }],
        complexCommands: []  
        },
    }; 

    api.control.sendActuationCommand(data, function(err, response) {
        assert.notEqual(response, null, 'response is null')
        if (err) {
            cb(err)
        } else {
            cb(null, response)
        }
    });
}

function pullActuations(parameters, deviceToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        from: parameters.from,
        to: parameters.to,
        deviceToken: deviceToken,
        accountId: accountId,
        deviceId: deviceId
    };
    
    api.control.pullActuations(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            cb(null, response)
        }
    })

}

function  saveComplexCommand(name, paramName, value, userToken, accountId, deviceId, actId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        commandName: name,
        body: {
            commands: [{
                componentId: actId,
                transport: "ws",
                parameters: [{
                    name: paramName,
                    value: value.toString()
                }]
            }]
        },
        deviceId: deviceId
    };

    api.control.saveComplexCommand(data, function(err, response) {
        assert.notEqual(response, null, 'response is null')
        if (err) {
            cb(err)
        } else {
            cb(null, response)
        }
    });
}


function  deleteComplexCommand(name, userToken, accountId) {

    var data = {
        userToken: userToken,
        accountId: accountId,
        commandName: name,
    };

    return new Promise((resolve, reject) => {
	api.control.deleteComplexCommand(data, function(err, response) {
            if (err) {
		reject(err);
            } else {
		resolve(response);
            }
	});
    })
}

module.exports={
    saveComplexCommand: saveComplexCommand,
    pullActuations: pullActuations,
    sendActuationCommand: sendActuationCommand,
    deleteComplexCommand: deleteComplexCommand
}
