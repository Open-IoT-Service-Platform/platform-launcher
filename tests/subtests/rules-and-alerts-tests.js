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

var test = function(userToken, accountId, deviceId, deviceToken, cbManager) {
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
	    promtests.addComponent(componentName, componentType, userToken, accountId, deviceId)
		.then((id) => {componentId = id; rules[switchOffCmdName].cid = componentId; rules[switchOnCmdName].cid = componentId;})
		.then(()   => promtests.addActuator(actuatorName, actuatorType, userToken, accountId, deviceId))
		.then((id) => {actuatorId = id;})
		.then(()   => promtests.createCommand(switchOffCmdName, componentParamName, 0, userToken, accountId, deviceId, actuatorId))
		.then(()   => promtests.createCommand(switchOnCmdName, componentParamName, 1, userToken, accountId, deviceId, actuatorId))
		.then(()   => promtests.createSimpleRule(rules[switchOffCmdName], userToken, accountId, deviceId))
    .then((ruleId) => ruleIds.push(ruleId))
		.then(()   => promtests.createSimpleRule(rules[switchOnCmdName], userToken, accountId, deviceId))
    .then((ruleId) => ruleIds.push(ruleId))
		.then(()   => {done();})
		.catch((err) => {done(err);});
	},
	"sendObservations": function(done){
	    assert.notEqual(componentId, null, "CommponentId not defined");
	    assert.notEqual(rules[switchOnCmdName].id, null, "Rule not defined");
	    assert.notEqual(rules[switchOffCmdName].id, null, "Rule not defined");
	    assert.notEqual(cbManager, null, "cbManager proxy not defined");
	    assert.notEqual(deviceToken, undefined, "Device Token not defined");
	    assert.notEqual(deviceId, null, "DeviceId not defined");
	    promtests.checkObservations(temperatureValues, rules[switchOnCmdName].cid, cbManager, deviceToken , accountId, deviceId, componentParamName)
		.then(() => {done();})
		.catch((err) => { done(err);});
	},
    "deleteRuleAndSendDataAgain": function(done){
		promtests.deleteRule(userToken, accountId, rules[switchOnCmdName].id)
		.then(() => promtests.deleteRule(userToken, accountId, rules[switchOffCmdName].id))
    .then(() => setTimeout(() => {return;}, 5000)) // Give RE 5 seconds to adapt
    .then(() => promtests.checkObservations(temperatureValues2, rules[switchOnCmdName].cid, cbManager, deviceToken, accountId, deviceId, componentParamName, 1000))
		.then(() => {done();})
		.catch((err) => {done(err);});
	},
    "createRulesAndCheckAlarmReset": function(done) {
		    promtests.createSimpleRule(rules[switchOffCmdName], userToken, accountId, deviceId, "Manual")
        .then((ruleId) => ruleIds.push(ruleId))
        .then(() => promtests.getAlerts(userToken, accountId, deviceId))
        .then((alerts) => {
            var proms = [];
            alerts.forEach(function(alert){proms.push(promtests.updateAlert(userToken, accountId, alert.alertId, "Open"))})
            return Promise.all(proms);

        })
        //.then()
        .then(() => promtests.checkObservations(temperatureValues3, rules[switchOnCmdName].cid, cbManager, deviceToken, accountId, deviceId, componentParamName, 1000))
		.then(()   => {done();})
		.catch((err) => {done(err);});
	},
	"cleanup": function(done){
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
	    //delete 2 most recent alerts
	    //delete new components
	    promtests.deleteComponent(userToken, accountId, deviceId, componentId)
		.then(() => promtests.deleteComponent(userToken, accountId, deviceId, actuatorId))
	    //delete new commands
		.then(() => helpers.control.deleteComplexCommand(switchOnCmdName, userToken, accountId))
		.then(() => helpers.control.deleteComplexCommand(switchOffCmdName, userToken, accountId))
	    //delete Statistic Rules
		.then(() => promtests.deleteRule(userToken, accountId, rules[switchOnCmdName].id))
		.then(() => promtests.deleteRule(userToken, accountId, rules[switchOffCmdName].id))
		.then(() => getListOfAlerts(userToken, accountId))
		.then((alerts) => {
      var filteredAlerts = alerts.filter((alert) => ruleIds.find((elem) => alert.ruleId == elem))
      var proms = filteredAlerts.map(alert => helpers.alerts.deleteAlert(userToken, accountId, alert.alertId))
		    return Promise.all(proms);
		})
		.then(() => {done();})
		.catch((err) => {done(err);});
	}
    };
};

var descriptions = {
    "createBasicRules": "Shall create basic rules and wait for synchronization with RE",
    "sendObservations": "Shall send observations and trigger event for basic rules",
    "deleteRuleAndSendDataAgain": "Shall send observation with recreated rule and not trigger events",
    "createRulesAndCheckAlarmReset": "Shall send observation and not triggering Manual reset rules",
    "cleanup": "Cleanup components, commands, rules created for subtest"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
