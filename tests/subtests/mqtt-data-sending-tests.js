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

var test = function(userToken, accountId, deviceId, deviceToken, cbManager, mqttConnector) {
    var componentNames = ["temperature-sensor-sdt", "metadata-sensor-sdt", "binarystate-senosr-sdt"];
    var componentTypes = ["temperature.v1.0", "metaData.v1.0", "binaryState.v1.0"];
    var componentBasicTypes = ["number", "string", "boolean"];
    var promtests = require('./promise-wrap');
    var componentId = [];
    var newDeviceId = "d-e-v-i-c-e-mqtt";
    var newDeviceName = "devicename-mqtt";
    const MIN_NUMBER = 0.0001;
    const BASE_TIMESTAMP = 1000000000000;

    var dataValues1 = [
        [{
            component: 0,
            value: 10.1,
            ts: 1 + BASE_TIMESTAMP
        }]
    ];


    var dataValues2 = [
        [{
            component: 1,
            value: "test1",
            ts: 1020 + BASE_TIMESTAMP
        },
        {
            component: 1,
            value: "test2",
            ts: 1030 + BASE_TIMESTAMP
        }
        ],
        [{
            component: 0,
            value: 13.4,
            ts: 1040 + BASE_TIMESTAMP
        },
        {
            component: 0,
            value: 20,
            ts: 1050 + BASE_TIMESTAMP
        }],
        [{
            component: 2,
            value: "1",
            ts: 1060 + BASE_TIMESTAMP
        },
        {
            component: 2,
            value: "0",
            ts: 1070 + BASE_TIMESTAMP
        }]
    ];

    var dataValues3 = [
        [{
            component: 0,
            value: 25,
            ts: 100000 + BASE_TIMESTAMP,
            loc: [1.2444, 10.987, 456.789],
            attributes: {
                "key1": "value1"
            }
        }],
        [{
            component: 0,
            value: 26,
            ts: 200000 + BASE_TIMESTAMP,
            attributes: {
                "key1": "value1",
                "key2": "value2",
                "key3": "value3"
            }
        }],
        [{
            component: 0,
            value: 27.9,
            ts: 300000 + BASE_TIMESTAMP,
            attributes: {
                "key3": "value1",
                "key4": "value2"
            }
        }],
        [{
            component: 0,
            value: 28.1,
            ts: 400000 + BASE_TIMESTAMP,
            loc: [0.0, 0.0, 0.0]
        }],
        [{
            component: 0,
            value: 30.12,
            ts: 500000 + BASE_TIMESTAMP,
            loc: [200.345, 300.21],
            attributes: {
                "key5": "key1"
            }
        }],
        [{
            component: 1,
            value: "test123",
            ts: 600000 + BASE_TIMESTAMP,
            loc: [210.345, 260.21],
            attributes: {
                "key6": "value6"
            }
        }],
        [{
            component: 2,
            value: "1",
            ts: 700000 + BASE_TIMESTAMP,
            loc: [100.12, 300.12],
            attributes: {
                "key5": "value6",
                "key1": "value1"
            }
        }]
    ];

    var flattenArray = function(array) {
        var results = array.map(function(element) {
            return element;
        });
        results = results
            .reduce(function(acc, cur) {
                return acc.concat(cur);
            })
            .filter((elem) => elem.component < componentId.length);
        return results;
    };

    var findMapping = function(foundComponentMap, componentIds, series) {
        var mapping = {};
        Object.keys(foundComponentMap).forEach(function(i) {
            mapping[i] = series.findIndex(
                element => componentIds[i] === element.componentId
            );
        });
        return mapping;
    };

    //flatten sent array and provide numComponents
    var prepareValues = function(dataValues, keys) {
        //First get a flat array of aggregated points
        var flattenedDataValues = flattenArray(dataValues, keys);
        var numComponents = {};
        flattenedDataValues.forEach(function(element){
            numComponents[element.component] = element.component;
        });
        var listOfExpectedResults = [];
        //Get elements sorted by componentId
        Object.values(numComponents).forEach(function(i){
            listOfExpectedResults[i] = flattenedDataValues.filter(
                (element) => (element.component === i)
            );
        });
        return {
            flattenedDataValues: flattenedDataValues,
            numComponents: numComponents,
            listOfExpectedResults: listOfExpectedResults
        };
    };

    /*
    var aggregation = {
        MAX: 0,
        MIN: 1,
        COUNT: 2,
        SUM: 3,
        SUMOFSQUARES: 4
    };
    */

    var createObjectFromData = function(sample, sampleHeader) {
        var o = {};
        sample.forEach(function(element, index) {
            if (element !== "") {
                var key = sampleHeader[index];
                if (key === "Value") {
                    key = "value";
                } else if (key === "Timestamp") {
                    key = "ts";
                }
                o[key] = element;
            }
        });
        return o;
    };

    var locEqual = function(dataValue, element, onlyExistingAttr) {
        if (onlyExistingAttr) {
            if (element.lat === undefined && element.long === undefined) {
                return true;
            }
        }
        if (dataValue.loc === undefined) {
            if ((element.lat === undefined || element.lat === "") && (element.lat === undefined ||
                element.lon === "") && (element.alt === undefined || element.alt === "")) {
                return true;
            } else {
                return false;
            }
        }
        if ((dataValue.loc[0] === undefined || (Math.abs(dataValue.loc[0] - Number(element.lat))) <= MIN_NUMBER) &&
        (dataValue.loc[1] === undefined || (Math.abs(dataValue.loc[1].toString() - Number(element.lon))) <= MIN_NUMBER) &&
        (dataValue.loc[2] === undefined || (Math.abs(dataValue.loc[2].toString() - Number(element.alt))) <= MIN_NUMBER)) {
            return true;
        } else {
            return false;
        }
    };

    var attrEqual = function(dataValue, element, onlyExistingAttr) {
        var result = true;
        if (dataValue.attributes !== undefined) {
            Object.keys(dataValue.attributes).forEach(function(el) {
                if (!onlyExistingAttr && element[el] !== dataValue.attributes[el]) {
                    result = false;
                } else {
                    if (element[el] !== undefined && element[el] !== dataValue.attributes[el]) {
                        result = false;
                    }
                }
            });
        }
        return result;
    };

    var pointsEqual = function(element, expected){

        if (componentBasicTypes[expected.component] === "string") {
            return element.value === expected.value;
        } else if (componentBasicTypes[expected.component] === "number") {
            var diff = Math.abs(element.value - expected.value);
            return diff < MIN_NUMBER;
        } else if (componentBasicTypes[expected.component] === "bytearray") {
            return (element.value.equals(expected.value));
        } else if (componentBasicTypes[expected.component] === "boolean") {
            return element.value === expected.value;
        }
        return false;
    };

    var comparePoints = function(dataValues, points, onlyExistingAttributes) {
        var result = true;
        var reason = "";
        var onlyExistingAttr = onlyExistingAttributes === undefined ? false : onlyExistingAttributes;
        if (points.length !== dataValues.length) {
            return "Wrong number of returned points";
        }
        points.forEach(function(element, index) {
            if ((element.ts !== dataValues[index].ts) ||
          !pointsEqual(element, dataValues[index]) ||
          !locEqual(dataValues[index], element, onlyExistingAttr) ||
          !attrEqual(dataValues[index], element, onlyExistingAttr)) {
                result = false;
                reason = "Point " + JSON.stringify(element) + " does not fit to expected value " +
            JSON.stringify(dataValues[index]);
            }
        });
        if (result === true) {return true;}
        else {return reason;}
    };

    /*
    var calcAggregationsPerComponent = function(flattenedArray) {

        return flattenedArray.reduce(function(acc, val) {
            if (aggregateable[val.component] === 0) {
                return acc;
            }
            if (val.value > acc[val.component][aggregation.MAX]) {
                acc[val.component][aggregation.MAX] = val.value;
            }
            if (val.value < acc[val.component][aggregation.MIN]) {
                acc[val.component][aggregation.MIN] = val.value;
            }
            acc[val.component][aggregation.COUNT]++;
            acc[val.component][aggregation.SUM] += val.value;
            acc[val.component][aggregation.SUMOFSQUARES] += val.value * val.value;
            return acc;
        }, [[Number.MIN_VALUE, Number.MAX_VALUE, 0, 0, 0], [Number.MIN_VALUE, Number.MAX_VALUE, 0, 0, 0]]);
    };*/

    //********************* Main Object *****************//
    //---------------------------------------------------//
    return {
        "setup": function(done) {
            var username = process.env.USERNAME;
            var password = process.env.PASSWORD;

            promtests.authGetToken(username, password)
                .then((grant) => promtests.createDevice(newDeviceName, newDeviceId, grant.token, accountId))
                .then(() => promtests.activateDevice(userToken, accountId, newDeviceId))
                .then((token) => {
                    deviceToken = token.deviceToken;
                })
                .then(() =>
                    promtests.addComponent(componentNames[0], componentTypes[0],
                        userToken, accountId, newDeviceId))
                .then((id) => { componentId[0] = id; })
                .then(() => promtests.addComponent(componentNames[1], componentTypes[1],
                    userToken, accountId, newDeviceId))
                .then((id) => { componentId[1] = id; })
                .then(() => promtests.addComponent(componentNames[2], componentTypes[2],
                    userToken, accountId, newDeviceId))
                .then((id) => { componentId[2] = id; })
                .then(() => done())
                .catch((err) => { done(err); });
        },

        "sendSingleDataPoint": function(done) {
            promtests.mqttSetCredential(mqttConnector, deviceToken, newDeviceId)
                .then(() => promtests.mqttSubmitData(mqttConnector, dataValues1[0][0], deviceToken, accountId,
                    newDeviceId, componentId[0]))
                .then(() => { done(); })
                .catch((err) => { done(err); });
        },

        "sendMultipleDataPoints": function(done) {
            var proms = [];
            dataValues2.forEach(function(element) {
                proms.push(promtests.mqttSubmitDataList(mqttConnector, element, deviceToken, accountId, newDeviceId, componentId, {}));
            });
            Promise.all(proms)
                .then(() => {
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        },
        "sendDataPointsWithAttributes": function(done) {
            var proms = [];
            dataValues3.forEach(function(element) {
                proms.push(promtests.mqttSubmitDataList(mqttConnector, element, deviceToken, accountId, newDeviceId, componentId));
            });
            Promise.all(proms)
                .then(() => {
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        },
        "receiveSingleDataPoint": function(done) {
            var listOfExpectedResults = flattenArray(dataValues1);
            promtests.searchData(BASE_TIMESTAMP, 1 + BASE_TIMESTAMP, deviceToken, accountId, newDeviceId, componentId[0], false, {})
                .then((result) => {
                    if (result.series.length !== 1) {return done("Wrong number of point series! (Expected:1, got:" + result.series.length + ")");}
                    var comparisonResult = comparePoints(listOfExpectedResults, result.series[0].points);
                    if (comparisonResult === true) {
                        done();
                    } else {
                        done(comparisonResult);
                    }
                })
                .catch((err) => {
                    done(err);
                });
        },
        "receiveMultipleDataPoints": function(done) {
            var pValues = prepareValues(dataValues2);
            var foundComponentsMap = pValues.numComponents;
            var listOfExpectedResults = pValues.listOfExpectedResults;

            promtests.searchData(BASE_TIMESTAMP + 1020, BASE_TIMESTAMP + 1080, deviceToken, accountId, newDeviceId, componentId, false, {})
                .then((result) => {
                    if (result.series.length !== componentId.length) {
                        return done("Wrong number  of point series!");
                    }
                    //Mapping is needed because the results are not in sending order
                    // e.g. component[0] could be now be in series[3]
                    var err = 0;
                    var mapping = findMapping(foundComponentsMap, componentId, result.series);
                    Object.entries(mapping).forEach(function(element){
                        var comparisonResult = comparePoints(listOfExpectedResults[element[0]], result.series[element[1]].points);
                        if (comparisonResult !== true) {
                            err = 1 ;
                            done(comparisonResult);
                        }
                    });
                    if (!err) {
                        done();
                    }
                })
                .catch((err) => {
                    done(err);
                });
        },
        "receiveDataPointsWithAttributes": function(done) {
            var pValues = prepareValues(dataValues3);
            var foundComponentMap = pValues.numComponents;
            var flattenedDataValues = pValues.flattenedDataValues;
            promtests.searchDataAdvanced(100000 + BASE_TIMESTAMP, 700000 + BASE_TIMESTAMP,
                deviceToken, accountId, newDeviceId, componentId, true, undefined, undefined, undefined)
                .then((result) => {
                    var mapping = findMapping(foundComponentMap, componentId, result.data[0].components);
                    if (result.data[0].components.length !== componentId.length) {
                        return done("Wrong number of point series!");
                    }
                    var err = false;
                    var resultObjects = Object.entries(mapping).reduce((accum, mappingElem) => {
                        var testresult =
                result.data[0].components[mappingElem[1]].samples.reduce((accum_inner, comp) => {
                    accum_inner.push(createObjectFromData(comp,
                        result.data[0].components[mappingElem[1]].samplesHeader));
                    return accum_inner;
                }, []);
                        return accum.concat(testresult);
                    }, []);
                    var comparisonResult = comparePoints(flattenedDataValues, resultObjects);
                    if (comparisonResult !== true) {
                        err = 1;
                        return done(comparisonResult);
                    }
                    if (!err) {
                        return done();
                    }
                })
                .catch((err) => {
                    done(err);
                });

        },
        "waitForBackendSynchronization": function(delay, done) {
            setTimeout(done, delay);

        },

        "cleanup": function(done) {
            promtests.deleteComponent(userToken, accountId, newDeviceId, componentId[0])
                .then(() => promtests.deleteComponent(userToken, accountId, newDeviceId, componentId[1]))
                .then(() => promtests.deleteComponent(userToken, accountId, newDeviceId, componentId[2]))
                .then(() => promtests.deleteDevice(userToken, accountId, newDeviceId))
                .then(() => { done(); })
                .catch((err) => { done(err); });
        }
    };
};

var descriptions = {
    "cleanup": "Cleanup components, commands, rules created for subtest",
    "sendAggregatedDataPoints": "Shall send multiple datapoints for one component",
    "sendSingleDataPoint": "Send a single data point",
    "sendMultipleDataPoints": "Send several data points in one message",
    "sendDataPointsWithAttributes": "Send data points with attributes and location",
    "receiveSingleDataPoint": "Receive single data point",
    "receiveMultipleDataPoints": "Receive multiple data points",
    "receiveDataPointsWithAttributes": "Receive data pints with attributes and location",
    "waitForBackendSynchronization": "Waiting maximal tolerable time backend needs to flush so that points are available",
    "setup": "Setup device and components for subtest"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
