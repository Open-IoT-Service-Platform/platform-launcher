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
var expect = chai.expect;

var oispSdk = require("oisp-sdk-js");
var api = oispSdk.api.rest;
var proxyConnector = oispSdk.lib.proxies.getControlConnector('ws');

var helpers = require("./lib/helpers");

var accountName = "oisp-tests";
var deviceName = "oisp-tests-device"

var componentName = "temperature-sensor"
var componentType = "temperature.v1.0"

var actuatorName = "powerswitch-actuator"
var actuatorType = "powerswitch.v1.0"

var switchOnCmdName = "switch-on"
var switchOffCmdName = "switch-off"

var rules = [];

rules[switchOnCmdName] = {
    name: "oisp-tests-rule-low-temp",
    conditionComponent: componentName,
    basicConditionOperator: "<=",
    basicConditionValue: "15",
    actuationCmd: switchOnCmdName
};

rules[switchOffCmdName] = {
    name: "oisp-tests-rule-high-temp",
    conditionComponent: componentName,
    basicConditionOperator: ">",
    basicConditionValue: "25",
    actuationCmd: switchOffCmdName
};

//-------------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------------

describe("OISP E2E Testing", function() {
    var userToken;
    var accountId;
    var deviceId;
    var deviceToken;
    var componentId;
    var actuatorId;
    var ruleId;
    var componentParamName;
    var firstObservationTime;

    var temperatureValues = [{
            value: -15,
            expectedActuation: 1 // swich on
        },
        {
            value: -5,
            expectedActuation: 1 // swich on
        },
        {
            value: 5,
            expectedActuation: 1 // swich on
        },
        {
            value: 15,
            expectedActuation: 1 // swich on
        },
        {
            value: 25,
            expectedActuation: null // do nothing (no actuation)
        },
        {
            value: 30,
            expectedActuation: 0 // swich off
        },
        {
            value: 20,
            expectedActuation: null // do nothing (no actuation)
        },
        {
            value: 14,
            expectedActuation: 1 // swich on
        },
        {
            value: 20,
            expectedActuation: null // do nothing (no actuation)
        },
        {
            value: 28,
            expectedActuation: 0 // swich off
        }
    ];


    before(function(done) {
        userToken = null;
        accountId = null;
        deviceId = "00-11-22-33-44-55";
        deviceToken = null;
        componentId = null;
        actuatorId = null;
        ruleId = null;
        componentParamName = "on";
        firstObservationTime = null;

        done();
    });

    it('Shall authenticate', function(done) {
        var username = process.env.USERNAME;
        var password = process.env.PASSWORD;

        assert.isNotEmpty(username, "no username provided");
        assert.isNotEmpty(password, "no password provided");

        helpers.login(username, password, function(err, token) {
            if (err) {
                done(new Error("Cannot authenticate: " + err));
            } else {
                userToken = token;
                done();
            }
        })
    })

    it('Shall create account', function(done) {
        assert.notEqual(userToken, null, "Invalid user token")

        helpers.createAccount(accountName, userToken, function(err, id) {
            if (err) {
                done(new Error("Cannot create account: " + err));
            } else {
                accountId = id;
                done();
            }
        })
    })

    it('Shall create device', function(done) {
        assert.notEqual(accountId, null, "Invalid account id")

        helpers.createDevice(deviceName, deviceId, userToken, accountId, function(err, id) {
            if (err) {
                done(new Error("Cannot create device: " + err));
            } else {
                done();
            }
        })
    })

    it('Shall activate device', function(done) {
        assert.notEqual(deviceId, null, "Invalid device id")

        helpers.activateDevice(userToken, accountId, deviceId, function(err, token) {
            if (err) {
                done(new Error("Cannot activate device " + err));
            } else {
                deviceToken = token;
                done();
            }
        })
    })

    it('Shall create component', function(done) {
        assert.notEqual(deviceToken, null, "Invalid device token")

        helpers.createComponent(componentName, componentType, userToken, accountId, deviceId, false, function(err, id) {
            if (err) {
                done(new Error("Cannot create component: " + err));
            } else {
                componentId = id;
                done();
            }
        })
    }).timeout(10000);


    it('Shall create actuator', function(done) {
        assert.notEqual(deviceToken, null, "Invalid device token")

        helpers.createComponent(actuatorName, actuatorType, userToken, accountId, deviceId, false, function(err, id) {
            if (err) {
                done(new Error("Cannot create actuator: " + err));
            } else {
                actuatorId = id;
                done();
            }
        })
    }).timeout(10000);

    it('Shall create switch-on actuation command', function(done) {
        assert.notEqual(actuatorId, null, "Invalid actuator id")

        helpers.createCommand(switchOnCmdName, componentParamName, 1, userToken, accountId, deviceId, actuatorId, function(err) {
            if (err) {
                done(new Error("Cannot create switch-on command: " + err));
            } else {
                done();
            }
        })

    }).timeout(10000);

    it('Shall create switch-off actuation command', function(done) {
        assert.notEqual(actuatorId, null, "Invalid actuator id")

        helpers.createCommand(switchOffCmdName, componentParamName, 0, userToken, accountId, deviceId, actuatorId, function(err) {
            if (err) {
                done(new Error("Cannot create switch-off command: " + err));
            } else {
                done();
            }
        })

    }).timeout(10000);

    it('Shall create switch-on rule', function(done) {
        assert.notEqual(deviceToken, null, "Invalid device token")

        rules[switchOnCmdName].cid = componentId;

        helpers.createRule(rules[switchOnCmdName], 10, userToken, accountId, deviceId, function(err, id) {
            if (err) {
                done(new Error("Cannot create switch-on rule: " + err));
            } else {
                rules[switchOnCmdName].id = id;
                done();
            }
        })

    }).timeout(20000);

    it('Shall create switch-off rule', function(done) {
        assert.notEqual(deviceToken, null, "Invalid device token")

        rules[switchOffCmdName].cid = componentId;

        helpers.createRule(rules[switchOffCmdName], 10, userToken, accountId, deviceId, function(err, id) {
            if (err) {
                done(new Error("Cannot create switch-off rule: " + err));
            } else {
                rules[switchOffCmdName].id = id;
                done();
            }
        })

    }).timeout(20000);

    it('Shall send observation and check rules', function(done) {
        assert.notEqual(componentId, null, "Invalid component id")
        assert.notEqual(rules[switchOnCmdName].id, null, "Invalid switch-on rule id")
        assert.notEqual(rules[switchOffCmdName].id, null, "Invalid switch-off rule id")
        assert.notEqual(proxyConnector, null, "Invalid websocket proxy connector")

        var index = 0;
        var nbActuations = 0;
        var serverReadyTimeout = 120000;
        var startTime = new Date().getTime();

        for (var i = 0; i < temperatureValues.length; i++) {
            temperatureValues[i].ts = null;
            if (temperatureValues[i].expectedActuation != null) {
                nbActuations++;
            }
        }

        var step = function(){
            index++;

            if (index == temperatureValues.length) {
                done();
            } else {
                sendObservationAndCheckRules(index);
            }
        };

        helpers.wsConnect(proxyConnector, deviceToken, deviceId, function(message) {
            --nbActuations;

            var expectedValue = temperatureValues[index].expectedActuation.toString();
            var componentParam = message.content.params.filter(function(param){
                return param.name == componentParamName;
            });
            if(componentParam.length == 1)
            {
                var param = componentParam[0];
                var paramValue = param.value.toString();

                if(paramValue == expectedValue)
                {
                    step();
                }
                else
                {
                    done(new Error("Param value wrong. Expected: " + expectedValue + " Received: " + paramValue));
                }
            }
            else
            {
                done(new Error("Did not find component param: " + componentParamName))
            }
        });

        var sendObservationAndCheckRules = function(index) {
            helpers.sendObservation(temperatureValues[index].value, deviceToken, accountId, deviceId, componentId, function(err, ts) {
                temperatureValues[index].ts = ts;

                if (index == 0) {
                    firstObservationTime = temperatureValues[index].ts;
                }

                 if (err) {
                    var err = "Cannot send observation: "+err;
                    if ( index == 0 ) // wait for the server to start
                    {
                        var now = new Date().getTime();
                        if ( ( now - startTime) < serverReadyTimeout )
                        {
                            err = null;
                            setTimeout( function ()
                            {
                                sendObservationAndCheckRules(0);
                            }, 1000 )
                        }
                    }

                    if ( err )
                    {
                        done(err);
                    }
                }

                if (temperatureValues[index].expectedActuation == null) {
                    step();
                }
            });
        }

        setTimeout(function(){
            sendObservationAndCheckRules(index);
        }, 20 * 1000);


    }).timeout(120000)

    //---------------------------------------------------------------

    it('Shall check observation', function(done) {
        helpers.getData(firstObservationTime, userToken, accountId, deviceId, componentId, function(err, data) {
            if (err) {
                done(new Error("Cannot get data: " + err))
            }

            if (data && data.length >= temperatureValues.length) {
                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < temperatureValues.length; j++) {
                        if (temperatureValues[j].ts == data[i].ts && temperatureValues[j].value == data[i].value) {
                            temperatureValues[j].ts = null;
                        }
                    }
                }

                var err = "";
                for (var i = 0; i < temperatureValues.length; i++) {
                    if (temperatureValues[i].ts != null) {
                        err += "[" + i + "]=" + temperatureValues[i].value + " ";
                    }
                }
                if (err.length == 0) {
                    done();
                } else {
                    done(new Error("Got wrong data for " + err))
                }
            } else {
                done(new Error("Cannot get data"))
            }

        })
    }).timeout(10000);

});
