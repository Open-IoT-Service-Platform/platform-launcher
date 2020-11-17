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
/* jshint node: true */

"use strict";

var test = function(userToken, accountId) {
    var chai = require('chai');
    var assert = chai.assert;
    var componentNames = ["temperature-sensor-st", "humidity-sensor-st", "metadata-sensor-st", "binarystate-senosr-st", "binarydata-sensor-st"];
    var componentTypes = ["temperature.v1.0", "humidity.v1.0", "metaData.v1.0", "binaryState.v1.0", "images.v1.0"];
    var componentMapping = {};
    var promtests = require('./promise-wrap');
    var componentIds = [];
    var newDeviceId = "scaleDevice";
    var newDeviceNumber = 100;
    var scaleSamplesNumber = 11000;
    const BASE_TIMESTAMP = 1000000000000;


    function random(max) {
        return Math.floor(Math.random() * max);
    }

    var dataValues = [
        {
            component: 0,
            value: 10,
            ts: BASE_TIMESTAMP
        },
        {
            component: 1,
            value: 12,
            ts: BASE_TIMESTAMP
        },
        {
            component: 2,
            value: "Hello World",
            ts: BASE_TIMESTAMP
        },
        {
            component: 3,
            value: 1,
            ts: BASE_TIMESTAMP
        },
        {
            component: 4,
            value: Buffer.from("Hello World!"),
            ts: BASE_TIMESTAMP
        }
    ];
    //********************* Main Object *****************//
    //---------------------------------------------------//
    return {
        "setup": function(done) {
            var promises = Array.apply(0, Array(newDeviceNumber)).map((item, index) => {
                return promtests.createDevice(newDeviceId + index, newDeviceId + index, userToken, accountId)
                    .then(() => promtests.activateDevice(userToken, accountId, newDeviceId + index))
                    .then(() => promtests.addComponent(componentNames[index % 5], componentTypes[index % 5], userToken, accountId, newDeviceId + index))
                    .then(id => {componentIds[index] = []; componentIds[index][0] = id; return;})
                    .then(() => {
                        var randComp = random(5);
                        if (randComp === index % 5) {
                            randComp += 1;
                            randComp = randComp % 5;
                        }
                        componentMapping[newDeviceId + index] = randComp; //save the random component for later to determine data type
                        return promtests.addComponent(componentNames[randComp], componentTypes[randComp], userToken, accountId, newDeviceId + index);
                    })
                    .then(id => {componentIds[index][1] = id; return;})
                    .catch((err) => {
                        done(err);
                    });
            });

            Promise.all(promises)
                .then(() => done())
                .catch((err) => {
                    done(err);
                });
        },
        "sendDataToSingleDevice": function(done) {
            var did = newDeviceId + "0";
            var index = 0;
            /* jshint -W119 */
            var promchain = Array.apply(0, Array(scaleSamplesNumber)).reduce(async (acc) => {
            /* jshint +W119 */
                await acc;
                var valueList = [];
                valueList[0] = dataValues[0];
                valueList[0].component = 0;
                valueList[0].ts = BASE_TIMESTAMP + (newDeviceNumber + 1) * 100 + index * 100;
                var cidList = componentIds[0];
                index++;
                return promtests.submitDataListAsUser(valueList, userToken, accountId, did, cidList);
            }, Promise.resolve());
            promchain.then(() => done())
                .catch((err) => {
                    done(err);
                });
        },
        "sendDataToAllDevices": function(done) {
            var promises = Array.apply(0, Array(newDeviceNumber)).map((item, index) => {
                var valueList = [];
                valueList[0] = dataValues[index % 5];
                valueList[1] = dataValues[componentMapping[newDeviceId + index]];
                valueList[0].ts = BASE_TIMESTAMP + index * 100;
                valueList[0].component = 0;
                valueList[1].ts = BASE_TIMESTAMP + index * 100;
                valueList[1].component = 1;
                var cidList = componentIds[index];
                return promtests.submitDataListAsUser(valueList, userToken, accountId, newDeviceId + index, cidList);
            });
            Promise.all(promises)
                .then(() => done())
                .catch((err) => {
                    done(err);
                });
        },
        "countAllData": function(done) {
            var deviceIds = Array.apply(0, Array(newDeviceNumber))
                .map((item, index) => newDeviceId + index);
            var cids = componentIds.reduce((acc, cur)=> acc.concat(cur));
            promtests.searchDataAdvanced(BASE_TIMESTAMP, BASE_TIMESTAMP + newDeviceNumber * 100,
                userToken, accountId, deviceIds, cids, false, undefined, undefined, true)
                .then((result) => {
                    if (result.data.length !== newDeviceNumber) {
                        return done("Wrong number of point series!");
                    }
                    assert.equal(result.rowCount, newDeviceNumber * 2);
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        },
        "countPartialData": function(done) {
            var deviceIds = Array.apply(0, Array(newDeviceNumber))
                .map((item, index) => newDeviceId + index);
            var cids = componentIds.reduce((acc, cur)=> acc.concat(cur));
            var partialDeviceNumber = newDeviceNumber / 2;
            promtests.searchDataAdvanced(BASE_TIMESTAMP, BASE_TIMESTAMP + (partialDeviceNumber - 1) * 100,
                userToken, accountId, deviceIds, cids, false, undefined, undefined, true)
                .then((result) => {
                    if (result.data.length !== newDeviceNumber) {
                        return done("Wrong number of point series! Got " + result.data.length + " expected " + newDeviceNumber);
                    }
                    assert.equal(result.rowCount, newDeviceNumber);
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        },
        "countSingleDeviceData": function(done) {
            var deviceIds = newDeviceId + "0";
            promtests.searchDataAdvanced(BASE_TIMESTAMP + newDeviceNumber * 100, -1, userToken,
                accountId, deviceIds, componentIds[0], false, undefined, undefined, true)
                .then((result) => {
                    if (result.data.length !== 1) {
                        return done("Wrong number of point series! Got " + result.data.length + " expected " + "1");
                    }
                    assert.equal(result.rowCount, scaleSamplesNumber);
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        },
        "waitForBackendSynchronization": function(delay, done) {
            setTimeout(done, delay);
        },
        "cleanup": function(done) {
            var promises = Array.apply(0, Array(newDeviceNumber)).map((item, index) => {
                return promtests.deleteDevice(userToken, accountId, newDeviceId + index)
                    .catch((err) => {
                        done(err);
                    });
            });

            Promise.all(promises)
                .then(() => done())
                .catch((err) => {
                    done(err);
                });
        }
    };
};

var descriptions = {
    "setup": "Shall setup needed devices and components",
    "sendDataToAllDevices": "Send Data to all devices",
    "sendDataToSingleDevice": "Send large amount of data to single device",
    "countAllData": "Count data of all devices and components",
    "countPartialData": "Count data of partial devices and components",
    "countSingleDeviceData": "Count large amount of data sent to single device",
    "waitForBackendSynchronization": "Waiting maximal tolerable time backend needs to flush so that points are available",
    "cleanup": "Cleanup components, commands, rules created for subtest"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
