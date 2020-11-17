/**
 * Copyright (c) 2019 Intel Corporation
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

var test = function(userToken1, userToken2) {

    var chai = require('chai');
    var tough = require('tough-cookie');
    var assert = chai.assert;
    var config = require('../test-config.json');
    var request = require('request-promise').defaults({ jar: true });
    var componentName = "temperature-sensor-srt";
    var componentType = "temperature.v1.0";
    var promtests = require('./promise-wrap');
    var apiDataSourcePath = '/api/datasources/proxy';
    var refreshedUserToken1;
    var refreshedUserToken2;
    var accountId1_1;
    var accountId1_2;
    var accountId2;
    var deviceId1_1 = "11-11-22-33-44-55";
    var deviceId1_2 = "12-11-22-33-44-55";
    var deviceId2 = "20-11-22-33-44-55";
    var deviceToken1_1;
    var deviceToken1_2;
    var deviceToken2;
    var componentId1_1_1;
    var componentId1_1_2;
    var componentId1_2;
    var componentId2;
    var componentData1_1_1 = 15;
    var componentData1_1_2 = 15;
    var componentData1_2 = 20;
    var componentData2 = 25;
    var datasourceId;
    var cookiejar1;
    var cookiejar2;
    var startTime = new Date();
    var grafanaUrl = config.grafana.protocol + '://' + config.grafana.host + ':' +
        config.grafana.port + config.grafana.subPath;
    var grafanaOptions = {
        strictSSL: config.grafana.strictSSL,
        proxy: config.grafana.proxy.host && config.grafana.proxy.port ?
            config.grafana.protocol + '://' + config.grafana.proxy.host + ':' +
            config.grafana.proxy.port : undefined,
        timeout: config.grafana.timeout,
        resolveWithFullResponse: true,
        simple: false,
        jar: true
    };


    //********************* Main Object *****************//
    //---------------------------------------------------//
    return {
        "prepareGrafanaTestSetup": function(done) {
	    // To be independent of main tests, own accounts, devices and components have to be created
	    promtests.createAccount("acc1_1", userToken1)
                .then((response) => {accountId1_1 = response.id;})
                .then(() => promtests.createAccount("acc1_2", userToken1))
                .then((response) => {accountId1_2 = response.id;})
                .then(() => promtests.authGetToken(process.env.USERNAME, process.env.PASSWORD))
                .then((grant) => { userToken1 = grant.token; })
                .then(() => promtests.createAccount("acc2", userToken2))
                .then((response) => {accountId2 = response.id;})
                .then(() => promtests.authGetToken(process.env.USERNAME2, process.env.PASSWORD2))
                .then((grant) => { userToken2 = grant.token; })
                .then(() => promtests.createDevice("device1_1", deviceId1_1, userToken1, accountId1_1))
                .then(() => promtests.createDevice("device1_2", deviceId1_2, userToken1, accountId1_2))
                .then(() => promtests.createDevice("device2", deviceId2, userToken2, accountId2))
                .then(() => promtests.activateDevice(userToken1, accountId1_1, deviceId1_1))
                .then((response) => {deviceToken1_1 = response.deviceToken;})
                .then(() => promtests.activateDevice(userToken1, accountId1_2, deviceId1_2))
                .then((response) => {deviceToken1_2 = response.deviceToken;})
                .then(() => promtests.activateDevice(userToken2, accountId2, deviceId2))
                .then((response) => {deviceToken2 = response.deviceToken;})
                .then(() => promtests.addComponent(componentName + '1', componentType, userToken1, accountId1_1, deviceId1_1))
                .then((id) => {componentId1_1_1 = id;})
                .then(() => promtests.addComponent(componentName + '2', componentType, userToken1, accountId1_1, deviceId1_1))
                .then((id) => {componentId1_1_2 = id;})
                .then(() => promtests.addComponent(componentName, componentType, userToken1, accountId1_2, deviceId1_2))
                .then((id) => {componentId1_2 = id;})
                .then(() => promtests.addComponent(componentName, componentType, userToken2, accountId2, deviceId2))
                .then((id) => {componentId2 = id;})
                .then(() => promtests.submitData(componentData1_1_1, deviceToken1_1, accountId1_1, deviceId1_1, componentId1_1_1))
                .then(() => promtests.submitData(componentData1_1_2, deviceToken1_1, accountId1_1, deviceId1_1, componentId1_1_2))
                .then(() => promtests.submitData(componentData1_2, deviceToken1_2, accountId1_2, deviceId1_2, componentId1_2))
                .then(() => promtests.submitData(componentData2, deviceToken2, accountId2, deviceId2, componentId2))
                .then(() => {
                    var username = process.env.USERNAME;
                    var password = process.env.PASSWORD;
                    return promtests.authGetToken(username, password);
                })
                .then((grant) => { refreshedUserToken1 = grant.token; })
                .then(() => {
                    var username = process.env.USERNAME2;
                    var password = process.env.PASSWORD2;
                    return promtests.authGetToken(username, password);
                })
                .then((grant) => { refreshedUserToken2 = grant.token; })
                .then(() => {
                    var cookie1 = new tough.Cookie({
                        key: "jwt",
                        value: refreshedUserToken1,
                    });
                    var cookie2 = new tough.Cookie({
                        key: "jwt",
                        value: refreshedUserToken2,
                    });
                    cookiejar1 = request.jar();
                    cookiejar1.setCookie(cookie1.toString(), config.grafana.protocol + "://" + config.grafana.host);
                    cookiejar2 = request.jar();
                    cookiejar2.setCookie(cookie2.toString(), config.grafana.protocol + '://' + config.grafana.host);
                    Promise.resolve();
                })
                .then(() => { done(); })
                .catch((err) => { done(err); });
        },
        "checkGrafanaHeartbeat": function(done) {
            var heartbeatPath = "/api/health";
            grafanaOptions.url = grafanaUrl + heartbeatPath;
            request(grafanaOptions).then(res => {
                if (res.statusCode === 200) {
                    done();
                } else {
                    done("Can't get heartbeat in grafana: " + res.statusCode);
                }
            }).catch(err => { done(err); });
        },
        "authenticateGrafanaAsViewer": function(done) {
        // this endpoint is for admins only -- see grafana api for more information
            var apiKeysPath = '/api/auth/keys';
	    assert.notEqual(refreshedUserToken1, null, "UserToken 1 not defined");

            grafanaOptions.url = grafanaUrl + apiKeysPath;
            grafanaOptions.jar = cookiejar1;
            request(grafanaOptions).then(res => {
                if (res.statusCode < 300) {
                    done('Authenticated as admin:  ' + res.statusCode);
                } else if (res.statusCode === 403) {
                    done();
                } else {
                    done('Unexpected response from Grafana: ' + res.statusCode);
                }
            }).catch(err => { done(err); });
        },
        "getDataSourceId": function(done) {
        // can only be invoked via admin role
            var datasourcesPath = '/api/datasources';
            assert.notEqual(refreshedUserToken1, null, "UserToken 1 not defined");

            grafanaOptions.url = config.grafana.protocol + '://' + config.grafana.admin + ':' + config.grafana.password +
                '@' + config.grafana.host + ':' + config.grafana.port + config.grafana.subPath + datasourcesPath;
            grafanaOptions.jar = cookiejar1;
            request(grafanaOptions).then(res => {
                if (res.statusCode !== 200) {
                    done('Can\'t get datasources in grafana: ' + res.statusCode);
                } else {
                    var datasources = JSON.parse(res.body);
                    if (datasources.length < 1) {
                        return done('No datasource found in grafana');
                    }
                    datasourceId = datasources[0].id;
                    done();
                }
            }).catch(err => { done(err); });
        },
        "queryUserAccountsData": function(done) {
            assert.notEqual(refreshedUserToken1, null, "UserToken 1 not defined");
            assert.notEqual(datasourceId, null, "Datasource Id not defined");
            assert.notEqual(accountId1_1, null, "AccountId 1.1 not defined");
            assert.notEqual(accountId1_2, null, "AccountId 1.2 not defined");
            assert.notEqual(componentId1_1_1, null, "ComponentId 1.1.1 not defined");
            assert.notEqual(componentId1_2, null, "ComponentId 1.2 not defined");

            var datasourceQueryBody = {
                start_absolute: startTime.getTime(),
                metrics: [
                    {
                        name: accountId1_1 + '.' + componentId1_1_1
                    },
                    {
                        name: accountId1_2 + '.' + componentId1_2,
                    }
                ]
            };

            grafanaOptions.jar = cookiejar1;
            grafanaOptions.url = grafanaUrl + apiDataSourcePath + '/' +
            datasourceId + config.grafana.datasourceQuery;
            grafanaOptions.headers = { 'Content-Type': 'application/json', 'charset': 'utf-8' };
            grafanaOptions.method = 'POST';
            grafanaOptions.body = JSON.stringify(datasourceQueryBody);
            request(grafanaOptions).then(res => {
                if (res.statusCode >= 300) {
                    done('Can\'t authenticate to datasource');
                } else {
                    var metrics = JSON.parse(res.body).queries[0].results;
                    var dataBelongsToUser = function(metric) {
                        if (metric.name === accountId1_1 + '.' + componentId1_1_1) {
                            return metric.values.every(timestampValuePair => {
                                return timestampValuePair[1] < componentData1_1_1 + 1E-10 &&
                                timestampValuePair[1] > componentData1_1_1 - 1E-10;
                            });
                        } else if (metric.name === accountId1_2 + '.' + componentId1_2) {
                            return metric.values.every(timestampValuePair => {
                                return timestampValuePair[1] < componentData1_2 + 1E-10 &&
                                timestampValuePair[1] > componentData1_2 - 1E-10;
                            });
                        } else {
                            return false;
                        }
                    };
                    if (!metrics.every(dataBelongsToUser)) {
                        done('Got unauthorized metric in grafana');
                    } else {
                        done();
                    }
                }
            });
        },
        "tryToGetUnbelongedData": function(done) {
            assert.notEqual(refreshedUserToken1, null, "UserToken 1 not defined");
            assert.notEqual(datasourceId, null, "Datasource Name not defined");
            assert.notEqual(accountId1_1, null, "AccountId 1.1 not defined");
            assert.notEqual(accountId2, null, "AccountId 2 not defined");
            assert.notEqual(componentId1_1_1, null, "ComponentId 1.1.1 not defined");
            assert.notEqual(componentId2, null, "ComponentId 2 not defined");

            var datasourceQueryBody = {
                start_absolute: startTime.getTime(),
                metrics: [
                    {
                        name: accountId1_1 + '.' + componentId1_1_1,
                    },
                    {
                        name: accountId2 + '.' + componentId2,
                    }
                ]
            };

            grafanaOptions.jar = cookiejar1;
            grafanaOptions.url = grafanaUrl + apiDataSourcePath + '/' +
            datasourceId + config.grafana.datasourceQuery;
            grafanaOptions.headers = { 'Content-Type': 'application/json', 'charset': 'utf-8' };
            grafanaOptions.method = 'POST';
            grafanaOptions.body = JSON.stringify(datasourceQueryBody);
            request(grafanaOptions).then(res => {
                if (res.body !== '' && JSON.parse(res.body).queries.length > 0) {
                    done('Expected empty result, but got some data: ' + res.body);
                } else if (res.statusCode < 400) {
                    done('Expected 400, got: ' + res.statusCode);
                } else {
                    done();
                }
            });
        },
        "getSuggestions": function(done) {
            assert.notEqual(refreshedUserToken1, null, "UserToken 1 not defined");
            assert.notEqual(datasourceId, null, "Datasource Name not defined");
            assert.notEqual(accountId1_1, null, "AccountId 1.1 not defined");
            assert.notEqual(componentId1_1_1, null, "ComponentId 1.1.1 not defined");
            assert.notEqual(componentId1_1_2, null, "ComponentId 1.1.2 not defined");

            grafanaOptions.jar = cookiejar1;
            grafanaOptions.url = grafanaUrl + apiDataSourcePath + '/' +
            datasourceId + config.grafana.datasourceSuggest + '?prefix=' + accountId1_1;
            grafanaOptions.headers = { 'Content-Type': 'application/json', 'charset': 'utf-8' };
            grafanaOptions.method = 'GET';
            request(grafanaOptions).then(res => {
                if (res.statusCode !== 200) {
                    done('Can\'t authenticate to datasource');
                } else {
                    var suggestions = JSON.parse(res.body).results;
                    suggestions.forEach(suggestion => {
                        if (suggestion !== accountId1_1 + '.' + componentId1_1_1 &&
                        suggestion !== accountId1_1 + '.' + componentId1_1_2) {
                            return done('Got unexpected suggestion: ' + suggestion);
                        }
                    });
                    done();
                }
            });
        },
        "tryToGetUnbelongedSuggestions": function(done) {
            assert.notEqual(refreshedUserToken2, null, "UserToken 2 not defined");
            assert.notEqual(datasourceId, null, "Datasource Name not defined");
            assert.notEqual(accountId1_1, null, "AccountId 1.1 not defined");
            assert.notEqual(componentId1_1_1, null, "ComponentId 1.1.1 not defined");
            assert.notEqual(componentId1_1_2, null, "ComponentId 1.1.2 not defined");

            grafanaOptions.jar = cookiejar2;
            grafanaOptions.url = grafanaUrl + apiDataSourcePath + '/' +
            datasourceId + config.grafana.datasourceSuggest + '?prefix=' + accountId1_1;
            grafanaOptions.headers = { 'Content-Type': 'application/json', 'charset': 'utf-8' };
            grafanaOptions.method = 'GET';
            request(grafanaOptions).then(res => {
                if (res.statusCode !== 200) {
                    done('Can\'t authenticate to datasource');
                } else {
                    var suggestions = JSON.parse(res.body).results;
                    if (suggestions !== undefined && suggestions.length > 0) {
                        done('Got unbelonged suggestions: ' + suggestions);
                    } else {
                        done();
                    }
                }
            });
        },
        "cleanup": function(done) {
	    // delete accounts
	    promtests.deleteAccount(refreshedUserToken1, accountId1_1)
                .then(() => promtests.deleteAccount(refreshedUserToken1, accountId1_2))
                .then(() => promtests.deleteAccount(refreshedUserToken2, accountId2))
            // renew user tokens
                .then(() => {
                    var username = process.env.USERNAME;
                    var password = process.env.PASSWORD;
                    assert.isNotEmpty(username, "no username provided");
                    assert.isNotEmpty(password, "no password provided");

                    promtests.authGetToken(username, password).then(grant => {
                        userToken1 = grant.token;
                    });
                })
                .then(() => {
                    var username = process.env.USERNAME2;
                    var password = process.env.PASSWORD2;
                    assert.isNotEmpty(username, "no username provided");
                    assert.isNotEmpty(password, "no password provided");

                    promtests.authGetToken(username, password).then(grant => {
                        userToken2 = grant.token;
                    });
                })
                .then(() => { done(); })
                .catch((err) => { done(err); });
        }
    };
};

var descriptions = {
    "prepareGrafanaTestSetup": "Create accounts, devices, components, example data for subtest",
    "checkGrafanaHeartbeat": "Shall check connection to Grafana",
    "authenticateGrafanaAsViewer": "Shall connect to grafana with a viewer role",
    "getDataSourceId": "Shall get id of the datasource registered at Grafana",
    "queryUserAccountsData": "Shall get metric values belonging to user",
    "tryToGetUnbelongedData": "Shall want unbelonged data and should get nothing",
    "getSuggestions": "Shall search and find metric names belonging to user",
    "tryToGetUnbelongedSuggestions": "Shall want unbelonged metric name and should get none",
    "cleanup": "Cleanup accounts, devices, components, example data created for subtest"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
