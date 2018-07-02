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




function getObservation(ts, userToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: {
            from: ts,
            targetFilter: {
                deviceList: [deviceId]
            },
            metrics: [{
                id: cid
            }]
        }
    }

    api.data.searchData(data, function(err, response) {
        var found = false;

        if (err) {
            cb(err);
        } else {
            if (response.series) {
                for (var i = 0; i < response.series.length; i++) {
                    for (var j = 0; j < response.series[i].points.length; j++) {
                        if (response.series[i].points[j].ts == ts) {
                            found = true;
                            cb(null, ts, parseInt(response.series[i].points[j].value));
                            break;
                        }
                    }
                }
            }

            if (!found) {
                cb(null, ts, null);
            }
        }
    });
}

function searchData(from, userToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: {
            from: from,
            targetFilter: {
                deviceList: [deviceId]
            },
            metrics: [{
                id: cid
            }]
        }
    };

    api.data.searchData(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            if (response.series) {
                cb(null, response.series[0].points)
            }
        }
    });
}


function submitData(value, deviceToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }
    var ts = new Date().getTime();

    var data = {
        deviceToken: deviceToken,
        deviceId: deviceId,
        body: {
            accountId: accountId,
            on: ts,
            data: [{
                componentId: cid,
                value: value.toString(),
                on: ts
            }]
        }
    }

    api.data.submitData(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            if (response.series) {
                cb(null, response.series[0].points)
            }
        }
    });
}

function searchDataAdvanced(from, userToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: {
            deviceIds: [deviceId],
            from: from,
            componentIds: [cid]
        }
    };

    api.data.searchDataAdvanced(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            assert.notEqual(response, null, 'response is null')
            cb(null, response)
        }
    });
}

module.exports={
    getObservation: getObservation,
    searchData: searchData,
    submitData: submitData,
    searchDataAdvanced: searchDataAdvanced
}