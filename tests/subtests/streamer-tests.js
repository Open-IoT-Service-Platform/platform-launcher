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
/*jshint esversion: 6 */
/*jshint undef: true, unused: true */
/*jshint node: true */

"use strict";

var test = function(userToken) {

    var chai = require('chai');
    const WebSocket = require('ws');
//    var tough = require('tough-cookie');
    var assert = chai.assert;
    var config = require('../test-config.json');
//    var request = require('request-promise').defaults({ jar: true });
    var componentName = "streamer-test-temperature-sensor";
    var componentType = "temperature.v1.0";
    var promtests = require('./promise-wrap');
//    var apiDataSourcePath = '/api/datasources/proxy';
    var accountId;
    var deviceId = "streamer-test-1-11-22-33-44-55";
    var deviceToken;
    var componentId1_1;
    var componentId1_2;
    var startTime = new Date();

    //********************* Main Object *****************//
    //---------------------------------------------------//
    return {
	"prepareStreamerTestSetup": function(done) {
	    promtests.createAccount("streamer-test-account", userToken)
		.then((response) => {accountId = response.id})
		.then(() => {
		    var username = process.env.USERNAME;
		    var password = process.env.PASSWORD;
		    return promtests.authGetToken(username, password);
		})
		.then((grant) => { userToken = grant.token; })
		.then(() => promtests.createDevice("device1", deviceId, userToken, accountId))
		.then(() => promtests.activateDevice(userToken, accountId, deviceId))
		.then((response) => {deviceToken = response.deviceToken})
		.then(() => promtests.addComponent(componentName + '1_1', componentType, userToken, accountId, deviceId))
		.then((id) => {componentId1_1 = id})
		.then(() => promtests.addComponent(componentName + '1_2', componentType, userToken, accountId, deviceId))
		.then((id) => {componentId1_2 = id})
		.then(() => { done(); })
		.catch((err) => { done(err); });
	},
	"testWithComponentSplitter": function(done) {
	    var nrDatapointsReceived = -1; // -1 because the first message is "OK"
	    const nrDatapointsTarget = 4;
            const sleep = require('sleep');
	    promtests.submitData(nrDatapointsReceived, deviceToken, accountId, deviceId, componentId1_1)
		.then(() => sleep.sleep(10))
    .then(() => {
      // THIS MUST BE FIXED, RACE CONDITION WITH LEADER ELECTION
      const ws = new WebSocket('ws://' + config.streamer.host + ':' + config.streamer.port);
      ws.on('open', function open() {
        const registerMessage =
        {"token": userToken,
        "service": "metrics",
        "components": [
          [accountId, componentId1_1],
          [accountId, componentId1_2]
        ]
      };
      ws.send(JSON.stringify(registerMessage));
    });

    ws.on('message', function incoming(data) {
      if (nrDatapointsReceived == -1) {
        sleep.sleep(10); // Sleep in first message to allow kafka time
        // for leader election for topic
      }
      nrDatapointsReceived += 1;
      process.stdout.write('.');
      if (nrDatapointsReceived == nrDatapointsTarget) {
        done();
      }
      //		console.log(data);
      //		console.log("Submitting:" + accountId + "." + componentId1_1);
      promtests.submitData(nrDatapointsReceived, deviceToken, accountId, deviceId, componentId1_1);
    })});

	},
	"cleanup": function(done) {
	    // delete accounts
	    promtests.deleteAccount(userToken, accountId)
		.then(() => { done(); })
		.catch((err) => { done(err); });
	},

/*        .then(() => promtests.createAccount("acc1_2", userToken1))
        .then((response) => {accountId1_2 = response.id})
        .then(() => promtests.authGetToken(process.env.USERNAME, process.env.PASSWORD))
        .then((grant) => { userToken1 = grant.token; })
        .then(() => promtests.createAccount("acc2", userToken2))
        .then((response) => {accountId2 = response.id})
        .then(() => promtests.authGetToken(process.env.USERNAME2, process.env.PASSWORD2))
        .then((grant) => { userToken2 = grant.token; })
        .then(() => promtests.createDevice("device1_1", deviceId1_1, userToken1, accountId1_1))
        .then(() => promtests.createDevice("device1_2", deviceId1_2, userToken1, accountId1_2))
        .then(() => promtests.createDevice("device2", deviceId2, userToken2, accountId2))
        .then(() => promtests.activateDevice(userToken1, accountId1_1, deviceId1_1))
*/
	"test": function(done) {
	    done();
	}
    }
}

var descriptions = {
    "prepareStreamerTestSetup": "Create accounts, devices and components required for this test.",
    "testWithComponentSplitter": "Bridge to output of component splitter service.",
    "cleanup": "Delete created account, devices and components for this test."
};

module.exports = {
    test: test,
    descriptions: descriptions
};
