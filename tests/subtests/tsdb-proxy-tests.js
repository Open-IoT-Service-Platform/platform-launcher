/**
 * Copyright (c) 2020 Intel Corporation
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

var test = function(userToken) {
    var chai = require('chai');
    var request = require('request-promise');
    var assert = chai.assert;
    var config = require('../test-config.json');
    var componentName = "temperature-sensor-srt";
    var componentType = "temperature.v1.0";
    var promtests = require('./promise-wrap');
    var deviceId = "11-11-22-33-44-55";

    var accountId, deviceToken, componentId;

    var componentData = [15, 20];
    var startTime = new Date();
    var tsdbUrl = config.tsdbproxy.protocol + '://' + config.tsdbproxy.host +
        ':' + config.tsdbproxy.port;
    var suggestUrl = tsdbUrl + '/' + config.tsdbproxy.suggest;
    var queryUrl = tsdbUrl + '/' + config.tsdbproxy.query;
    var tsdbOptions = {
        strictSSL: config.grafana.strictSSL,
        timeout: config.tsdbproxy.timeout,
        resolveWithFullResponse: true,
        json:true,
        simple: true
    };

    return {
        "prepareTestSetup": done => {
            promtests.createAccount("tsdbproxyacc", userToken).then(response => {
                accountId = response.id;
                return promtests.authGetToken(process.env.USERNAME, process.env.PASSWORD);
            }).then(grant => {
                userToken = grant.token;
                return promtests.createDevice("device", deviceId, userToken, accountId);
            }).then(() => {
                return promtests.activateDevice(userToken, accountId, deviceId);
            }).then(response => {
                deviceToken = response.deviceToken;
                return promtests.addComponent(componentName, componentType, userToken, accountId, deviceId);
            }).then(response => {
                componentId = response;
                return promtests.submitData(componentData[0], deviceToken, accountId, deviceId, componentId);
            }).then(() => {
                return promtests.submitData(componentData[1], deviceToken, accountId, deviceId, componentId);
            }).then(() => {
                setTimeout(done, 1000);
            }).catch(err => {
                done(err);
            });
        },
        "testQuery": done => {
            assert.notEqual(userToken, null, "userToken is undefined");
            assert.notEqual(accountId, null, "accountId is undefined");
            assert.notEqual(componentId, null, "componentId is undefined");

            var tsdbQueryBody = {
                start_absolute: startTime.getTime(),
                metrics: [
                    {
                        name: accountId + '.' + componentId
                    }
                ]
            };

            tsdbOptions.url = queryUrl;
            tsdbOptions.headers = { 'Authorization': 'Bearer ' + userToken,
                'charset': 'utf-8', 'Content-type': 'application/json' };
            tsdbOptions.method = 'post';
            tsdbOptions.body = tsdbQueryBody;

            request(tsdbOptions).then(response => {
                var metrics = response.body.queries[0].results;
                var dataBelongsToUser = function(metric) {
                    if (metric.name === accountId + '.' + componentId) {
                        return metric.values.every(timestampValuePair => {
                            return componentData.some(data => {
                                return timestampValuePair[1] < data + 1E-10 &&
                                    timestampValuePair[1] > data - 1E-10;
                            });
                        });
                    } else {
                        return false;
                    }
                };
                if (!metrics.every(dataBelongsToUser)) {
                    done('Got unexpected data from proxy: ' + metric.values);
                } else {
                    done();
                }
            }).catch(err => {
                done(err);
            });
        },
        "testSuggestion": done => {
            assert.notEqual(userToken, null, "userToken is undefined");
            assert.notEqual(accountId, null, "accountId is undefined");
            assert.notEqual(componentId, null, "componentId is undefined");

            tsdbOptions.url = suggestUrl + "?prefix=" + accountId;
            tsdbOptions.headers = { 'Authorization': 'Bearer ' + userToken, 'charset': 'utf-8' };
            tsdbOptions.method = 'get';
            delete tsdbOptions.body;

            request(tsdbOptions).then(response => {
                var suggestions = response.body.results;
                suggestions.forEach(suggestion => {
                    if (suggestion !== accountId + '.' + componentId) {
                        done("Got unexpected suggestion: ", suggestion);
                    }
                });
                done();
            }).catch(err => {
                done(err);
            });
        },
        "cleanup": function(done) {
            promtests.deleteAccount(userToken, accountId).then(() => {
                done();
            }).catch(err => {
                done(err);
            });
        }
    };
};

var descriptions = {
    "prepareTestSetup": "Create account, device and component for the subtest",
    "testQuery": "Shall search and find metric values belonging to user",
    "testSuggestion": "Shall search and find metric name belonging to user",
    "cleanup": "Cleanup account, device and component created for this subtest"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
