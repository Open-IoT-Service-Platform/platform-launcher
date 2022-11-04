/**
 * Copyright (c) 2021 Intel Corporation
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

var test = function(userToken, mqttConnector) {
    var chai = require('chai');
    var assert = chai.assert;
    var helpers = require("./../lib/helpers");
    var promtests = require('./promise-wrap');
    var mqttConfig = require('./../test-config-mqtt.json');

    var componentName = "temperature-sensor-rat";
    var componentType = "temperature.v1.0";
    var actuatorName = "powerswitch-actuator-rat";
    var actuatorType = "powerswitch.v1.0";
    var componentParamName = "LED";
    var switchOnCmdName = "switch-on-rat";
    var deviceId = "mqttfeedbackdevice";
    var gatewayId = "00-11-22-33-44-55";
    var cbManager = {
        cb: () => {}
    };

    var deviceToken;
    var accountId;
    var componentId;
    var actuatorId;

    var temperatureValues = [ { value: 17.3 }, { value: 1 }, { value: 17 }, { value: 30.1 }, { value: 15 } ];
    const numOfActuations = 1;

    return {
        setup: function(done) {
            promtests.createAccount("mqtt-feedback-account", userToken)
                .then(res => accountId = res.id)
                .then(() => promtests.authGetToken(process.env.USERNAME, process.env.PASSWORD))
                .then(res => userToken = res.token)
                .then(() => promtests.createDevice(deviceId, deviceId, userToken, accountId))
                .then(() => promtests.activateDevice(userToken, accountId, deviceId))
                .then(res => deviceToken = res.deviceToken)
                .then(() => promtests.addComponent(componentName, componentType, userToken, accountId, deviceId))
                .then(id => componentId = id)
                .then(() => promtests.addActuator(actuatorName, actuatorType, userToken, accountId, deviceId))
                .then(id => actuatorId = id)
                .then(() => promtests.createCommand(switchOnCmdName, componentParamName, 1, userToken, accountId, deviceId, actuatorId))
                .then(() => done())
                .catch(err => done(err));
        },
        openMqttConnection: function(done) {
            var topic = mqttConfig.connector.mqtt.topic.actuation;
            topic = topic.replace("{accountid}", accountId);
            topic = topic.replace("{gatewayId}", gatewayId);
            topic = topic.replace("{deviceid}", deviceId);
            var topics = [topic];
            helpers.mqtt.openMqttConnection(deviceToken, deviceId, topics, cbManager, done);
        },
        receiveControlActuation: function(done) {
            const actuationValue = 0;
            var actuationReceived = false;
            var topicCb = function(message) {
                message = JSON.parse(message);
                const expectedActuationValue = false;
                const componentMetric = message.metrics.filter(function(metric) {
                    return metric.name === componentParamName && actuatorId === metric.cid;
                });
                if (componentMetric.length === 1) {
                    const value = componentMetric[0].value;
                    if (value !== expectedActuationValue) {
                        done(new Error('Param value wrong. Expected: ' + expectedActuationValue + ' Received: ' + paramValue));
                    } else {
                        actuationReceived++;
                    }
                } else {
                    done(new Error('Did not find component param: ' + componentParamName));
                }
            };
            cbManager.cb = topicCb;
            var maxRetry = 10;
            var retry = 0;
            const checkActuation = function() {
                if (retry >= maxRetry) {
                    done(new Error('Actuation timed out after sending actuation command'));
                    return;
                }
                if (actuationReceived === numOfActuations) {
                    done();
                } else {
                    retry++;
                    setTimeout(checkActuation, 2000);
                }
            };
            helpers.control.sendActuationCommand(componentParamName, actuationValue, userToken, accountId, actuatorId, deviceId, function(err, response) {
                if (err) {
                    done(new Error('Cannot send an actuation: ' + err));
                } else {
                    assert.equal(response.status, 'OK', 'cannot send an actuation');
                    setTimeout(checkActuation, 2000);
                }
            });
        },
        cleanup: function(done) {
            promtests.deleteAccount(userToken, accountId)
                .then(() => done())
                .catch(err => done(err));
        }
    };
};

var descriptions = {
    "setup": "Create accounts, devices, components needed for this test",
    "openMqttConnection": "Open MQTT connection and wait until it syncs",
    "receiveControlActuation": "Shall receive actuation through control api",
    "cleanup": "Cleanup accounts, devices, components created during this test"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
