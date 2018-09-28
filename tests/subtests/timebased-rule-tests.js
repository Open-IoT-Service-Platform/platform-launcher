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
    var componentName = "temperature-sensor-tbrt";
    var componentType = "temperature.v1.0";
    var actuatorName = "powerswitch-actuator-tbrt";
    var actuatorType = "powerswitch.v1.0";
    var switchOnCmdName = "switch-on-tbrt";
    var switchOffCmdName = "switch-off-tbrt";
    var promtests = require('./promise-wrap');
    var rules = [];
    var componentId;
    var actuatorId;
    var componentParamName = "LED";

    rules[switchOnCmdName] = {
	name: "oisp-tests-rule-tb-gt20-30s",
	tbComponent: componentName,
	tbConditionOperator: ">=",
	tbConditionValue: "20", //>=20 temp
	tbTimelimit: 30, //wait 30s 
	actions: [
            {
                type: "actuation",
                target: [ switchOnCmdName ]
            }
        ],
    };

    rules[switchOffCmdName] = {
	name: "oisp-tests-rule-tb-lower20-30s",
	tbComponent: componentName,
	tbConditionOperator: "<",
	tbConditionValue: "20", //temp < 20
	tbTimelimit: 10,
	actions: [
            {
                type: "actuation",
                target: [ switchOffCmdName ]
            }
        ],
    };
    var temperatureValues = [
	{
            value: 20,
            expectedActuation: null,
	    delay: 0
	},
	{
	    value: 21,
	    expectedActuation: null,
	    delay: 1000
	},
	{
	    value: 22,
	    expectedActuation: null,
	    delay: 2000
	},
	{
	    value: 23,
	    expectedActuation: null,
	    delay: 4000
	},
	{
	    value: 24,
	    expectedActuation: null,
	    delay: 8000
	},
	{
	    value: 25,
	    expectedActuation: null,
	    delay: 8000
	},
	{
	    value: 49,
	    expectedActuation: 1,
	    delay: 10000
	},
	{
	    value: 50,
	    expectedActuation: 1,
	    delay: 1000
	},
	{
	    value: 51,
	    expectedActuation: 1,
	    delay: 1000
	},
	{
	    value: 19,
	    expectedActuation: null,
	    delay: 1000
	},
	{
	    value: 19,
	    expectedActuation: null,
	    delay: 2000
	},
	{
	    value: 19,
	    expectedActuation: null,
	    delay: 4000
	},
	{
	    value: 19,
	    expectedActuation: 0,
	    delay: 10000
	},
	{
	    value: 20,
	    expectedActuation: null,
	    delay: 1000
	},
	{
            value: 20,
            expectedActuation: null,
            delay: 1000
        }
    ];


    //********************* Main Object *****************//
    //---------------------------------------------------//
    return {
	"createTbRules": function(done) {
	    //To be independent of main tests, own sensors, actuators, and commands have to be created
	    promtests.addComponent(componentName, componentType, deviceToken, accountId, deviceId)
		.then((id) => {componentId = id; rules[switchOffCmdName].cid = componentId; rules[switchOnCmdName].cid = componentId;})
		.then(()   => promtests.addActuator(actuatorName, actuatorType, deviceToken, accountId, deviceId))
		.then((id) => {actuatorId = id;})
		.then(()   => promtests.createCommand(switchOffCmdName, componentParamName, 0, userToken, accountId, deviceId, actuatorId))
		.then(()   => promtests.createCommand(switchOnCmdName, componentParamName, 1, userToken, accountId, deviceId, actuatorId))
		.then(()   => promtests.createTbRule(rules[switchOffCmdName], userToken, accountId, deviceId))
		.then(()   => promtests.createTbRule(rules[switchOnCmdName], userToken, accountId, deviceId))
		.then(()   => {done();})
		.catch((err) => {done(err);});
	},
	"sendObservations": function(done){
	    assert.notEqual(componentId, null, "CommponentId not defined");
	    assert.notEqual(rules[switchOnCmdName].id, null, "Rule not defined");
	    assert.notEqual(rules[switchOffCmdName].id, null, "Rule not defined");
	    assert.notEqual(cbManager, null, "cbManager proxy not defined");
	    assert.notEqual(deviceToken, null, "Device Token not defined");
	    assert.notEqual(deviceId, null, "DeviceId not defined");

	    promtests.checkObservations(temperatureValues, rules[switchOnCmdName].cid, cbManager, deviceToken, accountId, deviceId, componentParamName)
		.then(() => {done();})
		.catch((err) => { done(err);});
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
		    var prm1 = helpers.alerts.deleteAlert(userToken, accountId, alerts[0].alertId);
		    var prm2 = helpers.alerts.deleteAlert(userToken, accountId, alerts[1].alertId);
		    var prm3 = helpers.alerts.deleteAlert(userToken, accountId, alerts[2].alertId);
		    return Promise.all([prm1, prm2, prm3]);
		})
		.then(() => {done();})
		.catch((err) => {done(err);});
	}
    };
};

var descriptions = {
    "createTbRules": "Shall create time based rules and wait for synchronization with RE",
    "sendObservations": "Shall send observations and trigger event for statistics rules",
    "cleanup": "Cleanup components, commands, rules created for subtest"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
