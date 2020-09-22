/**
 * Copyright (c) 2018 Intel Corporation
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

var test = function(userToken1, userToken2, accountId, deviceId, deviceToken,
        cbManager1, cbManager2, cbManager3, cbManager4, cbManager5) {
    var chai = require('chai');
    var assert = chai.assert;
    var helpers = require("../lib/helpers");
    var componentName = "temperature-sensor-rat";
    var componentType = "temperature.v1.0";
    var actuatorName = "powerswitch-actuator-rat";
    var actuatorType = "powerswitch.v1.0";
    var switchOnCmdName = "switch-on-rat";
    var switchOffCmdName = "switch-off-rat";
    var promtests = require('./promise-wrap');
    var rules = [];
    var ruleIds = []; // needed to track also deleted rules to be able to delete all related alerts for the test
    var componentId;
    var actuatorId;
    var componentParamName = "LED";

    // configurations for multiple device actuations test
    var deviceId1_1 = "device1_1";
    var deviceId1_2 = "device1_2";
    var deviceId2_1 = "device2_1";
    var deviceId2_2 = "device2_2";
    var deviceToken1_1;
    var deviceToken1_2;
    var deviceToken2_1;
    var deviceToken2_2;
    var switchOffCmdName1_1 = "switch-off-rat1_1";
    var switchOffCmdName1_2 = "switch-off-rat1_2";
    var switchOffCmdName2_1 = "switch-off-rat2_1";
    var switchOnCmdName1_1 = "switch-on-rat1_1";
    var switchOnCmdName1_2 = "switch-on-rat1_2";
    var switchOnCmdName2_1 = "switch-on-rat2_1";
    var accountId2;
    var componentTypeAll = "temperature.v1.0";
    var componentParamNameAll = "LED";
    var rules1_1 = [];
    var rules1_2 = [];
    var rules2_1 = [];
    var ruleIds1_1 = [];
    var ruleIds1_2 = [];
    var ruleIds2_1 = [];
    var componentId1_1;
    var componentId1_2;
    var componentId2_1;
    var componentId2_2;
    var actuatorId1_1;
    var actuatorId1_2;
    var actuatorId2_1;

    rules[switchOnCmdName] = {
        name: "oisp-tests-rule-rat-gte",
        conditionComponent: componentName,
        basicConditionOperator: ">=",
        basicConditionValue: "20",
        actions: [
            {
                type: "actuation",
                target: [ switchOnCmdName ]
            }
        ],
    };

    rules[switchOffCmdName] = {
        name: "oisp-tests-rule-rat-lt",
        conditionComponent: componentName,
        basicConditionOperator: "<",
        basicConditionValue: "10",
        actions: [
            {
                type: "actuation",
                target: [ switchOffCmdName ]
            }
        ],
    };

    rules1_1[switchOnCmdName1_1] = {
        name: "oisp-tests-rule-rat-gte",
        conditionComponent: componentName,
        basicConditionOperator: ">=",
        basicConditionValue: "20",
        actions: [
            {
                type: "actuation",
                target: [ switchOnCmdName1_1 ]
            }
        ],
    };

    rules1_1[switchOffCmdName1_1] = {
        name: "oisp-tests-rule-rat-lt",
        conditionComponent: componentName,
        basicConditionOperator: "<",
        basicConditionValue: "10",
        actions: [
            {
                type: "actuation",
                target: [ switchOffCmdName1_1 ]
            }
        ],
    };

    rules1_2[switchOnCmdName1_2] = {
        name: "oisp-tests-rule-rat-gte",
        conditionComponent: componentName,
        basicConditionOperator: ">=",
        basicConditionValue: "20",
        actions: [
            {
                type: "actuation",
                target: [ switchOnCmdName1_2 ]
            }
        ],
    };

    rules1_2[switchOffCmdName1_2] = {
        name: "oisp-tests-rule-rat-lt",
        conditionComponent: componentName,
        basicConditionOperator: "<",
        basicConditionValue: "10",
        actions: [
            {
                type: "actuation",
                target: [ switchOffCmdName1_2 ]
            }
        ],
    };

    rules2_1[switchOnCmdName2_1] = {
        name: "oisp-tests-rule-rat-gte",
        conditionComponent: componentName,
        basicConditionOperator: ">=",
        basicConditionValue: "20",
        actions: [
            {
                type: "actuation",
                target: [ switchOnCmdName2_1 ]
            }
        ],
    };

    rules2_1[switchOffCmdName2_1] = {
        name: "oisp-tests-rule-rat-lt",
        conditionComponent: componentName,
        basicConditionOperator: "<",
        basicConditionValue: "10",
        actions: [
            {
                type: "actuation",
                target: [ switchOffCmdName2_1 ]
            }
        ],
    };

    var temperatureValues = [
        {
            value: 17.1,
            expectedActuation: null
        },
        {
            value: 21,
            expectedActuation: 1,
        },
        {
            value: 17.9,
            expectedActuation: null,
        },
        {
            value: 17.5,
            expectedActuation: null,
        },
        {
            value: 8,
            expectedActuation: 0,
        },
        {
            value: 16.8,
            expectedActuation: null,
        },
        {
            value: 17.3,
            expectedActuation: null,
        },
        {
            value: 1,
            expectedActuation: 0
        },
        {
            value: 17,
            expectedActuation: null,
        },
        {
            value: 30.1,
            expectedActuation: 1 // switch on
        },
        {
            value: 25.0,
            expectedActuation: 1
        },
        {
            value: 9.0,
            expectedActuation: 0 //switch off
        },
        {
            value: 17.0,
            expectedActuation: null
        },
        {
            value: 5,
            expectedActuation: 0
        }
    ];

    var temperatureValues2 = [
        {
            value: 17.1,
            expectedActuation: null
        },
        {
            value: 21,
            expectedActuation: null,
        },
        {
            value: 17.9,
            expectedActuation: null,
        },
        {
            value: 17.5,
            expectedActuation: null,
        },
        {
            value: 8,
            expectedActuation: null,
        },
        {
            value: 16.8,
            expectedActuation: null,
        },
        {
            value: 17.3,
            expectedActuation: null,
        },
        {
            value: 1,
            expectedActuation: null
        },
        {
            value: 17,
            expectedActuation: null,
        },
        {
            value: 30.1,
            expectedActuation: null
        },
        {
            value: 25.0,
            expectedActuation: null
        },
        {
            value: 9.0,
            expectedActuation: null
        },
        {
            value: 17.0,
            expectedActuation: null
        },
        {
            value: 5,
            expectedActuation: null
        }
    ];

    var temperatureValues3 = [
        {
            value: 17.1,
            expectedActuation: null
        },
        {
            value: 15,
            expectedActuation: null,
        },
        {
            value: 12,
            expectedActuation: null,
        },
        {
            value: 10,
            expectedActuation: null,
        },
        {
            value: 8,
            expectedActuation: 0,
        },
        {
            value: 9,
            expectedActuation: null,
        },
        {
            value: 10,
            expectedActuation: null,
        },
        {
            value: 1,
            expectedActuation: null
        },
        {
            value: 17,
            expectedActuation: null,
        },
        {
            value: 30.1,
            expectedActuation: null
        },
        {
            value: 25.0,
            expectedActuation: null
        },
        {
            value: 9.0,
            expectedActuation: null
        },
        {
            value: 17.0,
            expectedActuation: null
        },
        {
            value: 11,
            expectedActuation: null
        }
    ];

    //********************* Main Object *****************//
    //---------------------------------------------------//
    return {
	"createBasicRules": function(done) {
	    //To be independent of main tests, own sensors, actuators, and commands have to be created
	    promtests.addComponent(componentName, componentType, userToken1, accountId, deviceId)
        .then((id) => {componentId = id; rules[switchOffCmdName].cid = componentId; rules[switchOnCmdName].cid = componentId;})
        .then(() => promtests.addActuator(actuatorName, actuatorType, userToken1, accountId, deviceId))
        .then((id) => {actuatorId = id;})
        .then(() => promtests.createCommand(switchOffCmdName, componentParamName, 0, userToken1, accountId, deviceId, actuatorId))
        .then(() => promtests.createCommand(switchOnCmdName, componentParamName, 1, userToken1, accountId, deviceId, actuatorId))
        .then(() => promtests.createSimpleRule(rules[switchOffCmdName], userToken1, accountId, deviceId))
        .then((ruleId) => ruleIds.push(ruleId))
        .then(() => promtests.createSimpleRule(rules[switchOnCmdName], userToken1, accountId, deviceId))
        .then((ruleId) => ruleIds.push(ruleId))
        .then(() => { done(); })
        .catch((err) => { done(err); });
	},
	"sendObservations": function(done){
	    assert.notEqual(componentId, null, "CommponentId not defined");
	    assert.notEqual(rules[switchOnCmdName].id, null, "Rule not defined");
	    assert.notEqual(rules[switchOffCmdName].id, null, "Rule not defined");
	    assert.notEqual(cbManager1, null, "cbManager1 proxy not defined");
	    assert.notEqual(deviceToken, undefined, "Device Token not defined");
	    assert.notEqual(deviceId, null, "DeviceId not defined");
	    promtests.checkObservations(temperatureValues, rules[switchOnCmdName].cid, cbManager1, deviceToken , accountId, deviceId, componentParamName)
		.then(() => { done(); })
		.catch((err) => { done(err);});
	},
    "deleteRuleAndSendDataAgain": function(done){
        promtests.deleteRule(userToken1, accountId, rules[switchOnCmdName].id)
        .then(() => promtests.deleteRule(userToken1, accountId, rules[switchOffCmdName].id))
        .then(() => setTimeout(() => { return; }, 5000)) // Give RE 5 seconds to adapt
        .then(() => promtests.checkObservations(temperatureValues2, rules[switchOnCmdName].cid, cbManager1, deviceToken, accountId, deviceId, componentParamName, 1000))
        .then(() => {done();})
        .catch((err) => {done(err);});
	},
    "createRulesAndCheckAlarmReset": function(done) {
        promtests.createSimpleRule(rules[switchOffCmdName], userToken1, accountId, deviceId, "Manual")
        .then((ruleId) => ruleIds.push(ruleId))
        .then(() => promtests.getAlerts(userToken1, accountId, deviceId))
        .then((alerts) => {
            var proms = [];
            alerts.forEach(function(alert){proms.push(promtests.updateAlert(userToken1, accountId, alert.alertId, "Open"))})
            return Promise.all(proms);
        }).then(() => promtests.checkObservations(temperatureValues3, rules[switchOnCmdName].cid, cbManager1, deviceToken, accountId, deviceId, componentParamName, 1000))
        .then(() => { done(); })
        .catch((err) => { done(err); });
	},
    "createMultipleDevicesAndComponents": function(done) {
        promtests.createDevice(deviceId1_1, deviceId1_1, userToken1, accountId)
        .then(() => promtests.activateDevice(userToken1, accountId, deviceId1_1))
        .then((res) => { deviceToken1_1 = res.deviceToken; })
        .then(() => promtests.createDevice(deviceId1_2, deviceId1_2, userToken1, accountId))
        .then(() => promtests.activateDevice(userToken1, accountId, deviceId1_2))
        .then((res) => { deviceToken1_2 = res.deviceToken; })
        .then(() => promtests.createAccount("multipleDevicesActuationsAccount", userToken2))
        .then((res) => { accountId2 = res.id; })
        .then(() => promtests.authGetToken(process.env.USERNAME2, process.env.PASSWORD2))
        .then((res) => { userToken2 = res.token; })
        .then(() => promtests.createDevice(deviceId2_1, deviceId2_1, userToken2, accountId2))
        .then(() => promtests.activateDevice(userToken2, accountId2, deviceId2_1))
        .then((res) => { deviceToken2_1 = res.deviceToken; })
        .then(() => promtests.createDevice(deviceId2_2, deviceId2_2, userToken2, accountId2))
        .then(() => promtests.activateDevice(userToken2, accountId2, deviceId2_2))
        .then((res) => { deviceToken2_2 = res.deviceToken; })
        .then(() => promtests.addComponent(componentName, componentType, userToken1, accountId, deviceId1_1))
        .then((id) => { componentId1_1 = id; rules1_1[switchOffCmdName1_1].cid = id; rules1_1[switchOnCmdName1_1].cid = id })
        .then(() => promtests.addComponent(componentName, componentType, userToken1, accountId, deviceId1_2))
        .then((id) => { componentId1_2 = id; rules1_2[switchOffCmdName1_2].cid = id; rules1_2[switchOnCmdName1_2].cid = id })
        .then(() => promtests.addComponent(componentName, componentType, userToken2, accountId2, deviceId2_1))
        .then((id) => { componentId2_1 = id; rules2_1[switchOffCmdName2_1].cid = id; rules2_1[switchOnCmdName2_1].cid = id })
        .then(() => promtests.addComponent(componentName, componentType, userToken2, accountId2, deviceId2_2))
        .then((id) => { componentId2_2 = id; })
        .then(() => promtests.addActuator(actuatorName, actuatorType, userToken1, accountId, deviceId1_1))
        .then((id) => { actuatorId1_1 = id; })
        .then(() => promtests.addActuator(actuatorName, actuatorType, userToken1, accountId, deviceId1_2))
        .then((id) => { actuatorId1_2 = id; })
        .then(() => promtests.addActuator(actuatorName, actuatorType, userToken2, accountId2, deviceId2_1))
        .then((id) => { actuatorId2_1 = id; })
        .then(() => promtests.createCommand(switchOffCmdName1_1, componentParamName, 0, userToken1, accountId, deviceId1_1, actuatorId1_1))
        .then(() => promtests.createCommand(switchOnCmdName1_1, componentParamName, 1, userToken1, accountId, deviceId1_1, actuatorId1_1))
        .then(() => promtests.createCommand(switchOffCmdName1_2, componentParamName, 0, userToken1, accountId, deviceId1_2, actuatorId1_2))
        .then(() => promtests.createCommand(switchOnCmdName1_2, componentParamName, 1, userToken1, accountId, deviceId1_2, actuatorId1_2))
        .then(() => promtests.createCommand(switchOffCmdName2_1, componentParamName, 0, userToken2, accountId2, deviceId2_1, actuatorId2_1))
        .then(() => promtests.createCommand(switchOnCmdName2_1, componentParamName, 1, userToken2, accountId2, deviceId2_1, actuatorId2_1))
        .then(() => promtests.createSimpleRule(rules1_1[switchOffCmdName1_1], userToken1, accountId, deviceId1_1))
        .then((ruleId) => ruleIds1_1.push(ruleId))
        .then(() => promtests.createSimpleRule(rules1_1[switchOnCmdName1_1], userToken1, accountId, deviceId1_1))
        .then((ruleId) => ruleIds1_1.push(ruleId))
        .then(() => promtests.createSimpleRule(rules1_2[switchOffCmdName1_2], userToken1, accountId, deviceId1_2))
        .then((ruleId) => ruleIds1_2.push(ruleId))
        .then(() => promtests.createSimpleRule(rules1_2[switchOnCmdName1_2], userToken1, accountId, deviceId1_2))
        .then((ruleId) => ruleIds1_2.push(ruleId))
        .then(() => promtests.createSimpleRule(rules2_1[switchOffCmdName2_1], userToken2, accountId2, deviceId2_1))
        .then((ruleId) => ruleIds2_1.push(ruleId))
        .then(() => promtests.createSimpleRule(rules2_1[switchOnCmdName2_1], userToken2, accountId2, deviceId2_1))
        .then((ruleId) => ruleIds2_1.push(ruleId))
        .then(() => { done(); })
        .catch((err) => { done(err); });
    },
    "sendObservationsWithMultipleDevices": function(done) {
        assert.notEqual(componentId1_1, null, "CommponentId1_1 not defined");
        assert.notEqual(componentId1_2, null, "CommponentId1_2 not defined");
        assert.notEqual(componentId2_1, null, "CommponentId2_1 not defined");
        assert.notEqual(componentId2_2, null, "CommponentId2_2 not defined");
        assert.notEqual(rules1_1[switchOnCmdName1_1].id, null, "Rule1_1 switch on not defined");
        assert.notEqual(rules1_1[switchOffCmdName1_1].id, null, "Rule1_1 switch off not defined");
        assert.notEqual(rules1_2[switchOnCmdName1_2].id, null, "Rule1_2 switch on not defined");
        assert.notEqual(rules1_2[switchOffCmdName1_2].id, null, "Rule1_2 switch off not defined");
        assert.notEqual(rules2_1[switchOnCmdName2_1].id, null, "Rule2_1 switch on not defined");
        assert.notEqual(rules2_1[switchOffCmdName2_1].id, null, "Rule2_1 switch off not defined");
        assert.notEqual(cbManager1, null, "cbManager1 proxy not defined");
        assert.notEqual(cbManager2, null, "cbManager2 proxy not defined");
        assert.notEqual(cbManager3, null, "cbManager3 proxy not defined");
        assert.notEqual(cbManager4, null, "cbManager4 proxy not defined");
        assert.notEqual(deviceToken1_1, undefined, "Device Token 1_1 not defined");
        assert.notEqual(deviceToken1_2, undefined, "Device Token 1_2 not defined");
        assert.notEqual(deviceToken2_1, undefined, "Device Token 2_1 not defined");
        assert.notEqual(deviceToken2_2, undefined, "Device Token 2_2 not defined");
        helpers.connector.openWsConnection(deviceToken1_1, deviceId1_1, cbManager2.cb);
        helpers.connector.openWsConnection(deviceToken1_2, deviceId1_2, cbManager3.cb);
        helpers.connector.openWsConnection(deviceToken2_1, deviceId2_1, cbManager4.cb);
        helpers.connector.openWsConnection(deviceToken2_2, deviceId2_2, cbManager5.cb);
        var promises = [];
        promises.push(promtests.checkObservations(temperatureValues, componentId1_1, cbManager2, deviceToken1_1, accountId, deviceId1_1, componentParamName, 0, 60 * 1000));
        promises.push(promtests.checkObservations(temperatureValues, componentId1_2, cbManager3, deviceToken1_2, accountId, deviceId1_2, componentParamName, 0, 60 * 1000));
        promises.push(promtests.checkObservations(temperatureValues, componentId2_1, cbManager4, deviceToken2_1, accountId2, deviceId2_1, componentParamName, 0, 60 * 1000));
        promises.push(promtests.checkObservations(temperatureValues2, componentId2_2, cbManager5, deviceToken2_2, accountId2, deviceId2_2, componentParamName, 0, 60 * 1000));
        Promise.all(promises)
        .then(() => { done(); })
        .catch((err) => { done(err); });
    },
    "cleanup": function(done) {
        var getListOfAlerts = function(userToken, accountId){
            return new Promise((resolve, reject) => {
                helpers.alerts.getListOfAlerts(userToken, accountId, function(err, response) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });
	    };
        // delete 2 most recent alerts
        // delete new components
        promtests.deleteComponent(userToken1, accountId, deviceId, componentId)
        .then(() => promtests.deleteComponent(userToken1, accountId, deviceId, actuatorId))
        // delete new commands
        .then(() => helpers.control.deleteComplexCommand(switchOnCmdName, userToken1, accountId))
        .then(() => helpers.control.deleteComplexCommand(switchOffCmdName, userToken1, accountId))
        // delete Statistic Rules
		.then(() => promtests.deleteRule(userToken1, accountId, rules[switchOnCmdName].id))
        .then(() => promtests.deleteRule(userToken1, accountId, rules[switchOffCmdName].id))
        .then(() => getListOfAlerts(userToken1, accountId))
        .then((alerts) => {
            var filteredAlerts = alerts.filter((alert) => ruleIds.find((elem) => alert.ruleId == elem));
            var proms = filteredAlerts.map(alert => helpers.alerts.deleteAlert(userToken1, accountId, alert.alertId));
            return Promise.all(proms);
        })
        // delete multiple actuation test resources
        .then(() => {
            helpers.connector.closeWsConnection(deviceId1_1);
            helpers.connector.closeWsConnection(deviceId1_2);
            helpers.connector.closeWsConnection(deviceId2_1);
            helpers.connector.closeWsConnection(deviceId2_2);
        })
        .then(() => promtests.deleteDevice(userToken1, accountId, deviceId1_1))
        .then(() => promtests.deleteDevice(userToken1, accountId, deviceId1_2))
        .then(() => promtests.deleteAccount(userToken2, accountId2))
        .then(() => helpers.control.deleteComplexCommand(switchOnCmdName1_1, userToken1, accountId))
        .then(() => helpers.control.deleteComplexCommand(switchOnCmdName1_2, userToken1, accountId))
        .then(() => helpers.control.deleteComplexCommand(switchOffCmdName1_1, userToken1, accountId))
        .then(() => helpers.control.deleteComplexCommand(switchOffCmdName1_2, userToken2, accountId))
        .then(() => promtests.deleteRule(userToken1, accountId, rules1_1[switchOnCmdName1_1].id))
        .then(() => promtests.deleteRule(userToken1, accountId, rules1_1[switchOffCmdName1_1].id))
        .then(() => promtests.deleteRule(userToken1, accountId, rules1_2[switchOnCmdName1_2].id))
        .then(() => promtests.deleteRule(userToken1, accountId, rules1_2[switchOffCmdName1_2].id))
        .then(() => getListOfAlerts(userToken1, accountId))
        .then((alerts) => {
            var filteredAlerts = alerts.filter((alert) => ruleIds1_1.find((elem) => alert.ruleId == elem));
            var proms = filteredAlerts.map(alert => helpers.alerts.deleteAlert(userToken1, accountId, alert.alertId));
            return Promise.all(proms);
        })
        .then((alerts) => {
            var filteredAlerts = alerts.filter((alert) => ruleIds1_2.find((elem) => alert.ruleId == elem));
            var proms = filteredAlerts.map(alert => helpers.alerts.deleteAlert(userToken1, accountId, alert.alertId));
            return Promise.all(proms);
        })
        .then(() => { done(); })
        .catch((err) => { done(err); });
    }
    };
};

var descriptions = {
    "createBasicRules": "Shall create basic rules and wait for synchronization with RE",
    "sendObservations": "Shall send observations and trigger event for basic rules",
    "deleteRuleAndSendDataAgain": "Shall send observation with recreated rule and not trigger events",
    "createRulesAndCheckAlarmReset": "Shall send observation and not triggering Manual reset rules",
    "createMultipleDevicesAndComponents": "Shall create and active multiple devices and add a component for each",
    "sendObservationsWithMultipleDevices": "Shall send observations with multiple devices and trigger events for basic rules with all of the devices",
    "cleanup": "Cleanup devices, components, commands, rules created for subtest"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
