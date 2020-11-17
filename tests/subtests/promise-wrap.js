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
/*jshint esversion: 6 */
/*jshint undef: true, unused: true */
/* jshint node: true */

"use strict";


var helpers = require("../lib/helpers");
var colors = require('colors'); // jshint ignore:line


var checkObservations = function(tempValues, cid, cbManager, deviceToken, accountId,
    deviceId, componentParamName, waitBetweenSendingSamples = 0, timeout = 60 * 1000) {
    var firstObservationTime;
    return new Promise((resolve, reject) => {
        var index = 0;
        var nbActuations = 0;
        process.stdout.write("    ");

        tempValues.forEach((value) => {
            value.ts = null;
            if (value.expectedActuation !== null) {
                nbActuations++;
            }
        });
        var step;
        var actuationCounter = 0;
        var sendObservationAndCheckRules = function(index) {
            function sendActualObservation() {
                var currentActuationCounter = actuationCounter;
                helpers.devices.submitData(tempValues[index].value, deviceToken, accountId, deviceId, cid, function(err, ts) {
                    tempValues[index].ts = ts;
                    if (index === 0) {
                        firstObservationTime = tempValues[index].ts;
                    }
                    if (err) {
                        reject(err);
                    }
                    if (tempValues[index].expectedActuation === null) {
                        setTimeout(step, waitBetweenSendingSamples);
                    } else {
                        var checkActuation = function(currentCounter) {
                            if (currentCounter >= actuationCounter) {
                                reject(new Error("Actuation timeout by component id: " + cid +
                                    ", data index: " + index + ", expected actuation value: " +
                                    tempValues[index].expectedActuation.toString()));
                            }
                        };
                        setTimeout(checkActuation, timeout, currentActuationCounter);
                    }
                });
            }
            process.stdout.write(".".green);
            if (tempValues[index].hasOwnProperty('delay')){
                setTimeout(sendActualObservation, tempValues[index].delay);
            } else {
                sendActualObservation();
            }
        };

        step = function() {
            index++;
            if (index === tempValues.length) {
                process.stdout.write("\n");
                if (nbActuations === 0) {
                    resolve();
                } else {
                    reject(new Error("Wrong number of actuations"));
                }
            } else {
                sendObservationAndCheckRules(index);
            }
        };

        var actuationCallback = function(message) {
            --nbActuations;
            var expectedActuationValue = tempValues[index].expectedActuation.toString();
            var componentParam = message.content.params.filter(function(param){
                return param.name === componentParamName;
            });

            if (componentParam.length === 1) {
                var param = componentParam[0];
                var paramValue = param.value.toString();
                if (paramValue === expectedActuationValue) {
                    step();
                } else {
                    reject(new Error("Param value wrong. Expected: " + expectedActuationValue + " Received: " + paramValue));
                }
            } else {
                reject(new Error("Did not find component param: " + componentParamName));
            }
        };
        cbManager.set(actuationCallback);
        sendObservationAndCheckRules(index);
    });
};

var addComponent = (componentName, componentType, deviceToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
        helpers.devices.addDeviceComponent(componentName, componentType, deviceToken, accountId, deviceId, function(err, id) {
	    if (err) {
                reject(err);
	    } else {
                resolve(id);
	    }
        });
    });
};
var addActuator = (actuatorName, actuatorType, deviceToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
        helpers.devices.addDeviceComponent(actuatorName, actuatorType, deviceToken, accountId, deviceId, function(err, id) {
	    if (err) {
                reject(err);
	    } else {
                resolve(id);
	    }
        });
    });
};
var createCommand = (cmdName, componentParamName, onOff, userToken, accountId, deviceId, actuatorId) => {
    return new Promise(function(resolve, reject){
        helpers.control.saveComplexCommand(cmdName, componentParamName, onOff, userToken, accountId, deviceId, actuatorId, function(err,response) {
	    if (err) {
                reject(err);
	    } else {
                if (response.status !== 'OK') {
		    reject(new Error("Wrong status: " + response.status));
                }
                else {
		    resolve();
                }
	    }
        });
    });
};

var createSimpleRule = (rule, userToken, accountId, deviceId, resetType="Automatic") => {
    return new Promise(function(resolve, reject){
        helpers.rules.createRule(rule, userToken, accountId, deviceId, resetType, function(err, id) {
	    if (err) {
                reject(err);
	    } else {
                rule.id = id;
                resolve(id);
	    }
        });
    });
};

var createStatisticRule = (rule, userToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
        helpers.rules.createStatisticRule(rule, userToken, accountId, deviceId, function(err, id) {
	    if (err) {
                reject(err);
	    } else {
                rule.id = id;
                resolve();
	    }
        });
    });
};

var createTbRule = (rule, userToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
        helpers.rules.createTbRule(rule, userToken, accountId, deviceId, function(err, id) {
	    if (err) {
                reject(err);
	    } else {
                rule.id = id;
                resolve();
	    }
        });
    });
};

var deleteComponent = function(userToken, accountId, deviceId, componentId){
    return new Promise((resolve, reject) => {
        helpers.devices.deleteDeviceComponent (userToken, accountId, deviceId, componentId, function(err, response){
	    if (err) {
                reject(err);
	    } else {
                resolve(response);
	    }
        });
    });
};
var deleteRule = function(userToken, accountId, ruleId){
    return new Promise((resolve, reject) => {
        helpers.rules.deleteRule (userToken, accountId, ruleId, function(err, response){
	    if (err) {
                reject(err);
	    } else {
                resolve(response);
	    }
        });
    });
};

var submitDataList = function(valueList, deviceToken, accountId, deviceId, cidList){
    return new Promise((resolve, reject) => {
        helpers.data.submitDataList(valueList, deviceToken, accountId, deviceId, cidList, function(err, response){
	    if (err) {
                reject(err);
	    } else {
                resolve(response);
	    }
        });
    });
};

var submitDataListAsUser = function(valueList, userToken, accountId, deviceId, cidList) {
    return new Promise((resolve, reject) => {
        helpers.data.submitDataListAsUser(valueList, userToken, accountId, deviceId, cidList, function(err, response) {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
};


var submitData = function(value, deviceToken, accountId, deviceId, cid){
    return new Promise((resolve, reject) => {
        helpers.data.submitData(value, deviceToken, accountId, deviceId, cid, function(err, response){
	    if (err) {
                reject(err);
	    } else {
                resolve(response);
	    }
        });
    });
};


var searchData = function(from, to, userToken, accountId, deviceId, cid, queryMeasureLocation, targetFilter){
    return new Promise((resolve, reject) => {
	    helpers.data.searchData(from, to, userToken, accountId, deviceId, cid, queryMeasureLocation, targetFilter, function(err, response){
	    if (err) {
                reject(err);
	    } else {
                resolve(response);
	    }
        });
    });
};

var searchDataMaxItems = function(from, to, userToken, accountId, deviceId, cids, queryMeasureLocation, targetFilter, maxItems, order, aggregators){
    return new Promise((resolve, reject) => {
        helpers.data.searchDataMaxItems(from, to, userToken, accountId, deviceId, cids,
            queryMeasureLocation, targetFilter, maxItems, order, aggregators, function(err, response){
	    if (err) {
                    reject(err);
	    } else {
                    resolve(response);
	    }
            });
    });
};


var searchDataAdvanced = function(from, to, userToken, accountId, deviceIds, cidList, showMeasureLocation, returnedMeasureAttributes, aggregations, countOnly){
    return new Promise((resolve, reject) => {
        if (!Array.isArray(deviceIds)){
            deviceIds = [deviceIds];
        }
	  helpers.data.searchDataAdvanced(from, to, userToken, accountId, deviceIds, cidList,
            showMeasureLocation, returnedMeasureAttributes, aggregations, countOnly, function(err, response){
	     if (err) {
                    reject(err);
	     } else {
		     resolve(response);
	     }
	  });
    });
};

var authGetToken = (username, password) => {
    return new Promise(function(resolve, reject){
        helpers.auth.login(username, password, function(err, tokens) {
            if (err) {
                reject(err);
	    } else {
                resolve(tokens);
            }
        });
    });
};

var refreshAuthToken = (oldToken, refreshToken) => {
    return new Promise(function(resolve, reject) {
        helpers.auth.refreshAuthToken(oldToken, refreshToken, function(err, response) {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
};

var invitationCreate = (userToken, accountId, receiverEmail) => {
    return new Promise(function(resolve, reject){
        helpers.invitation.createInvitation(userToken, accountId, receiverEmail, function(err, response) {
            if (err) {
                reject(err);
	    } else {
                resolve(response);
            }
        });
    });
};

var invitationAccept = (userToken, accountId, inviteId) => {
    return new Promise(function(resolve, reject){
        helpers.invitation.acceptInvitation(userToken, accountId, inviteId, function(err, response) {
            if (err) {
                reject(err);
	    } else {
                resolve(response);
            }
        });
    });
};

var authTokenInfo = (userToken) => {
    return new Promise(function(resolve, reject){
        helpers.auth.tokenInfo(userToken, function(err, response) {
            if (err) {
                reject(err);
	    } else {
                resolve(response);
            }
        });
    });
};

var accountCreate = (name, userToken) => {
    return new Promise(function(resolve, reject){
        helpers.accounts.createAccount(name, userToken, function(err, response) {
            if (err) {
                reject(err);
	    } else {
                resolve(response);
            }
        });
    });
};

var accountDelete = (userToken, accountId) => {
    return new Promise(function(resolve, reject){
        helpers.accounts.deleteAccount(userToken, accountId, function(err, response) {
            if (err) {
                reject(err);
	    } else {
                resolve(response);
            }
        });
    });
};

var inviteDelete = (userToken, accountId, email) => {
    return new Promise(function(resolve, reject){
        helpers.invitation.deleteInvitations(userToken, accountId,email, function(err, response) {
            if (err) {
                reject(err);
	    } else {
                resolve(response);
            }
        });
    });
};

var createDevice = (name, deviceId, userToken, accountId) => {
    return new Promise(function(resolve, reject){
        helpers.devices.createDevice(name, deviceId, userToken, accountId, function(err, response) {
            if (err) {
                reject(err);
	    } else {
                resolve(response);
            }
        });
    });
};

var deleteDevice = (userToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
        helpers.devices.deleteDevice(userToken, accountId, deviceId, function(err, response) {
            if (err) {
                reject(err);
	    } else {
                resolve(response);
            }
        });
    });
};

var activateDevice = (userToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
        helpers.devices.activateDevice(userToken, accountId, deviceId, function(err, response) {
            if (err) {
                reject(err);
	    } else {
                resolve(response);
            }
        });
    });
};

var activateDeviceWithoutToken = (activationCode, deviceId) => {
    return new Promise(function(resolve, reject){
        helpers.devices.activateDeviceWithoutToken(activationCode, deviceId, function(err, response) {
            if (err) {
                reject(err);
  	        } else {
                resolve(response);
            }
        });
    });
};

var getAccountActivationCode = (accountId, userToken) => {
    return new Promise(function(resolve, reject){
        helpers.accounts.getAccountActivationCode(accountId, userToken, function(err, response) {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
};
var mqttSetCredential = (connector, userToken, deviceId) => {
    return new Promise(function(resolve, reject) {
        helpers.mqtt.setCredential(connector, userToken, deviceId, function(err, response) {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
};

var mqttSubmitData = (connector, value, deviceToken, accountId, deviceId, cid) => {
    return new Promise(function(resolve, reject) {
        helpers.mqtt.submitData(connector, value, deviceToken, accountId, deviceId, cid, function(err) {
            if (err && err.status === 0) {
                resolve("OK");
            } else {
                reject("wrong status");
            }
        });
    });
};
var mqttSubmitDataList = (connector, valueList, deviceToken, accountId, deviceId, cid) => {
    return new Promise(function(resolve, reject) {
        helpers.mqtt.submitDataList(connector, valueList, deviceToken, accountId, deviceId, cid, function(err) {
            if (err && err.status === 0) {
                resolve("OK");
            } else {
                reject("wrong status");
            }
        });
    });
};

var getAlerts = (userToken, accountId) => {
    return new Promise(function(resolve, reject){
        helpers.alerts.getListOfAlerts(userToken, accountId, function(err, response) {
            if (err) {
                reject(new Error("Cannot get list of alerts: " + err));
            } else {
                resolve(response);
            }
        });
    });
};

var updateAlert = (userToken, accountId, alertId, status) => {
    return new Promise(function(resolve, reject) {
        helpers.alerts.updateAlertStatus(userToken, accountId, alertId, status, function(err) {
            if (err) {
                reject(new Error("Cannot update alert status " + err));
            } else {
                resolve();
            }
        });
    });
};

module.exports = {
    getAccountActivationCode: getAccountActivationCode,
    checkObservations: checkObservations,
    addComponent: addComponent,
    addActuator: addActuator,
    createCommand: createCommand,
    createStatisticRule: createStatisticRule,
    createSimpleRule: createSimpleRule,
    createTbRule: createTbRule,
    deleteComponent: deleteComponent,
    deleteRule: deleteRule,
    submitDataList: submitDataList,
    submitDataListAsUser: submitDataListAsUser,
    submitData: submitData,
    searchData: searchData,
    searchDataMaxItems: searchDataMaxItems,
    searchDataAdvanced: searchDataAdvanced,
    authGetToken: authGetToken,
    refreshAuthToken: refreshAuthToken,
    createInvitation: invitationCreate,
    acceptInvitation: invitationAccept,
    authTokenInfo: authTokenInfo,
    createAccount: accountCreate,
    deleteAccount: accountDelete,
    deleteInvite: inviteDelete,
    createDevice: createDevice,
    deleteDevice: deleteDevice,
    activateDevice: activateDevice,
    activateDeviceWithoutToken: activateDeviceWithoutToken,
    mqttSetCredential: mqttSetCredential,
    mqttSubmitData: mqttSubmitData,
    mqttSubmitDataList: mqttSubmitDataList,
    getAlerts: getAlerts,
    updateAlert: updateAlert
};
