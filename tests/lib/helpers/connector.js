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

var WebSocket = require('ws');
var chai = require('chai');
var assert = chai.assert;

var config = require("../../test-config.json");
var oispSdk = require("@open-iot-service-platform/oisp-sdk-js");
var api = oispSdk(config).api.rest;



function wsConnect(connector, deviceToken, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var deviceInfo = {
        device_id: deviceId,
        device_token: deviceToken
    };

    connector.updateDeviceInfo(deviceInfo)

    var data = {
        deviceId: deviceId
    };

    connector.controlCommandListen(data, cb, function() {});
}

var sockets = {};

function openWsConnection(deviceToken, deviceId, cb, address, protocols, options) {
    // Returns a raw ws socket without authentication if the address is specified.
    // The socket must be handled manually by the caller.
    if (address) {
        return new WebSocket(address, protocols, options);
    } else {
        var address = config.connector.ws.host + ':' + config.connector.ws.port;
        if (config.connector.ws.secure) {
            address = 'wss://' + address;
        } else {
            address = 'ws://' + address;
        }
        var socket = new WebSocket(address, 'echo-protocol');
        socket.on('open', () => {
            var deviceInfo = {
                type: 'device',
                deviceId: deviceId,
                deviceToken: deviceToken
            };
            socket.send(JSON.stringify(deviceInfo));
        });
        socket.on('message', (message) => {
            cb(JSON.parse(message).content);
        });
        sockets[deviceId] = socket;
        return socket;
    }
}

function closeWsConnection(deviceId) {
    return sockets[deviceId].close();
}

module.exports={
    wsConnect: wsConnect,
    openWsConnection: openWsConnection,
    closeWsConnection: closeWsConnection
};
