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
  var componentNames = ["temperature-sensor-sdt", "humidity-sensor-sdt", "metadata-sensor-sdt", "binarystate-senosr-sdt", "binarydata-sensor-sdt"];
  var componentTypes = ["temperature.v1.0", "humidity.v1.0", "metaData.v1.0", "binaryState.v1.0", "images.v1.0"];
  var componentBasicTypes = ["number", "number", "string", "boolean", "bytearray"];
  var aggregateable = [1, 1, 0, 0, 0];
  var promtests = require('./promise-wrap');
  var uuidv4 = require('uuid/v4');
  var rules = [];
  var componentId = [];
  var dataValues1Time;
  var dataValues2Time;
  var dataValues3Time;
  var dataValues4Time;
  var dataValues5StartTime;
  var dataValues5StopTime;
  var dataValues6StartTime;
  var dataValues6StopTime;
  var accountId2;
  var accountName2 = "badAccount";
  var userToken2;
  var username2 = process.env.USERNAME2;
  var password2 = process.env.PASSWORD2;
  var newDeviceId = "d-e-v-i-c-e";
  var newComponentId;
  const MIN_NUMBER = 0.0001;
  const MAX_SAMPLES = 1000;
  const MAX_SAMPLES_RETRIVE = 4000;
  const MAX_ITEMS_TEST_SAMPLES = 1000;
  const BASE_TIMESTAMP = 1000000000000;
  const DOWNSAMPLE_MULT = 8;

  var dataValues1 = [
    [{
      component: 0,
      value: 10.1,
      ts: 1 + BASE_TIMESTAMP
    }],
    [{
      component: 0,
      value: 11.2,
      ts: 2 + BASE_TIMESTAMP
    }, {
      component: 0,
      value: 12.3,
      ts: 3 + BASE_TIMESTAMP
    }],
    [{
      component: 0,
      value: 13.4,
      ts: 4 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 14.5,
      ts: 5 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 15.6,
      ts: 6 + BASE_TIMESTAMP
    }
    ],
    [{
      component: 0,
      value: 16.7,
      ts: 7 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 17.8,
      ts: 8 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 18.9,
      ts: 9 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 20.0,
      ts: 10 + BASE_TIMESTAMP
    }
    ],
    [{
      component: 0,
      value: 21.1,
      ts: 11 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 22.2,
      ts: 12 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 23.3,
      ts: 13 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 24.4,
      ts: 14 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 25.5,
      ts: 15 + BASE_TIMESTAMP
    }

    ]
  ];


  var dataValues2 = [
    [{
      component: 0,
      value: 10.1,
      ts: 1000 + BASE_TIMESTAMP
    }],
    [{
      component: 1,
      value: 10,
      ts: 1020 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 12.3,
      ts: 1030 + BASE_TIMESTAMP
    }
    ],
    [{
      component: 0,
      value: 13.4,
      ts: 1040 + BASE_TIMESTAMP
    },
    {
      component: 1,
      value: 20,
      ts: 1050 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 15.6,
      ts: 1060 + BASE_TIMESTAMP
    }
    ],
    [{
      component: 1,
      value: 30,
      ts: 1070 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 17.8,
      ts: 1070 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 18.9,
      ts: 1090 + BASE_TIMESTAMP
    },
    {
      component: 1,
      value: 40,
      ts: 1100 + BASE_TIMESTAMP
    }
    ],
    [{
      component: 1,
      value: 50,
      ts: 1170 + BASE_TIMESTAMP
    }],
    [{
      component: 1,
      value: 50,
      ts: 1200 + BASE_TIMESTAMP
    },
    {
        component: 2,
        value: "hello",
        ts: 1210 + BASE_TIMESTAMP
    },
    {
      component: 3,
      value: "1",
      ts: 1220 + BASE_TIMESTAMP
    },
    {
      component: 4,
      value: Buffer.from("Hello World. In Binary!!!"),
      ts: 1220 + BASE_TIMESTAMP
    }]
  ]

  var dataValues3 = [
    [{
      component: 0,
      value: 10,
      ts: 10000 + BASE_TIMESTAMP,
      loc: [99.12345, 12.3456, 456.789]
    }],
    [{
      component: 0,
      value: 11,
      ts: 20000 + BASE_TIMESTAMP,
      loc: [9.8765, 432.1, 9.876]
    }],
    [{
      component: 0,
      value: 12,
      ts: 30000 + BASE_TIMESTAMP,
    }],
    [{
      component: 0,
      value: 13,
      ts: 40000 + BASE_TIMESTAMP,
      loc: [0.0, 0.0, 0.0]
    }],
    [{
      component: 0,
      value: 14,
      ts: 50000 + BASE_TIMESTAMP,
      loc: [200.345, 300.21]
    }]
  ];

  var dataValues4 = [
    [{
      component: 1,
      value: 99,
      ts: 100000 + BASE_TIMESTAMP,
      loc: [1.2444, 10.987, 456.789],
      attributes: {
        "key1": "value1"
      }
    }],
    [{
      component: 1,
      value: 98,
      ts: 200000 + BASE_TIMESTAMP,
      attributes: {
        "key1": "value1",
        "key2": "value2",
        "key3": "value3"
      }
    }],
    [{
      component: 1,
      value: 97,
      ts: 300000 + BASE_TIMESTAMP,
      attributes: {
        "key3": "value1",
        "key4": "value2"
      }
    }],
    [{
      component: 1,
      value: 96,
      ts: 400000 + BASE_TIMESTAMP,
      loc: [0.0, 0.0, 0.0]
    }],
    [{
      component: 1,
      value: 95,
      ts: 500000 + BASE_TIMESTAMP,
      loc: [200.345, 300.21],
      attributes: {
        "key5": "key1"
      }
    }],
    [{
      component: 2,
      value: "test123",
      ts: 600000 + BASE_TIMESTAMP,
      loc: [210.345, 260.21],
      attributes: {
        "key6": "value6"
      }
    }],
    [{
      component: 3,
      value: "1",
      ts: 700000 + BASE_TIMESTAMP,
      loc: [100.12, 300.12],
      attributes: {
        "key5": "value6",
        "key1": "value1"
      }
    }],
    [{
      component: 4,
      value: Buffer.from("Hello World. In Binary 22221111!!!"),
      ts: 800000 + BASE_TIMESTAMP,
      loc: [600.12, 100.12],
      attributes: {
        "key3": "value6",
        "key1": "value5",
        "key2": "value3"
      }
    }]
  ];

  var dataValues5 = [
    [{
      component: componentNames.length,
      value: 10.1,
      ts: 1100000000 + BASE_TIMESTAMP
    }],
    [{
      component: 0,
      value: 10,
      ts: 1100020000 + BASE_TIMESTAMP
    },
    {
      component: componentNames.length,
      value: 12.3,
      ts: 1100030000 + BASE_TIMESTAMP
    }
    ],
    [{
      component: 0,
      value: 13.4,
      ts: 1100040000 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 20,
      ts: 1100050000 + BASE_TIMESTAMP
    },
    {
      component: componentNames.length,
      value: 15.6,
      ts: 1100060000 + BASE_TIMESTAMP
    }]
  ];

  var dataValues6 = [
    {
      component: 0,
      value: 1,
      ts: 1200000000 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 2,
      ts: 1200020000 + BASE_TIMESTAMP
    }
  ]

  var dataValues7 = [
    {
      component: 0,
      value: 101,
      ts: 1200000001 + BASE_TIMESTAMP
    },
    {
      component: 0,
      value: 102,
      ts: 1200020001 + BASE_TIMESTAMP
    }
  ]

  var findMapping = function(foundComponentMap, componentIds, series) {
    var mapping = {};
    Object.keys(foundComponentMap).forEach(function(i) {
      mapping[i] = series.findIndex(
        element => componentId[i] === element.componentId
      );
    });
    return mapping;
  }
//flatten sent array and provide numComponents
  var prepareValues = function(dataValues, keys) {
    //First get a flat array of aggregated points
    var flattenedDataValues = flattenArray(dataValues, keys);
    var numComponents = {};
    flattenedDataValues.forEach(function(element){
      numComponents[element.component] = element.component
    })
    var listOfExpectedResults = [];
    //Get elements sorted by componentId
    Object.keys(numComponents).forEach(function(i){
      listOfExpectedResults[i] = flattenedDataValues.filter(
        (element) => (element.component == i)
      );
    })
    return {
      flattenedDataValues: flattenedDataValues,
      numComponents: numComponents,
      listOfExpectedResults: listOfExpectedResults
    }
  }

  var aggregation = {
    MAX: 0,
    MIN: 1,
    COUNT: 2,
    SUM: 3,
    SUMOFSQUARES: 4
  }

  var createObjectFromData = function(sample, sampleHeader) {
    var o = {};
    sample.forEach(function(element, index) {
      if (element != "") {
        var key = sampleHeader[index];
        if (key === "Value") {
          key = "value";
        } else if (key === "Timestamp") {
          key = "ts";
        }
        o[key] = element;
      }
    })
    return o;
  }

  var locEqual = function(dataValue, element, onlyExistingAttr) {
    if (onlyExistingAttr) {
      if (element.lat === undefined && element.long === undefined) {
        return true;
      }
    }
    if (dataValue.loc == undefined) {
      if ((element.lat == undefined || element.lat === "") && (element.lat == undefined || element.lon === "") && (element.alt == undefined || element.alt === "")) {
        return true;
      } else {
        return false;
      }
    }
    if ((dataValue.loc[0] == undefined || (Math.abs(dataValue.loc[0] - Number(element.lat))) <= MIN_NUMBER)
      && (dataValue.loc[1] == undefined || (Math.abs(dataValue.loc[1].toString() - Number(element.lon))) <= MIN_NUMBER)
      && (dataValue.loc[2] == undefined || (Math.abs(dataValue.loc[2].toString() - Number(element.alt))) <= MIN_NUMBER)) {
      return true;
    } else {
      return false;
    }
  }

  var attrEqual = function(dataValue, element, onlyExistingAttr) {
    var result = true;
    if (dataValue.attributes !== undefined) {
      Object.keys(dataValue.attributes).forEach(function(el) {
        if (!onlyExistingAttr && element[el] != dataValue.attributes[el]) {
          result = false;
        } else {
          if (element[el] !== undefined && element[el] != dataValue.attributes[el]) {
            result = false;
          }
        }
      })
    }
    return result;
  }

  var pointsEqual = function(element, expected){

      if (componentBasicTypes[expected.component] === "string") {
        return element.value === expected.value;
      } else if (componentBasicTypes[expected.component] === "number") {
        var diff = Math.abs(element.value - expected.value);
        return diff < MIN_NUMBER;
      } else if (componentBasicTypes[expected.component] === "bytearray") {
        return (element.value.equals(expected.value));
      } else if (componentBasicTypes[expected.component] === "boolean") {
        return element.value == expected.value;
      }
      return false;
  }

  var comparePoints = function(dataValues, points, onlyExistingAttributes) {
    var result = true;
    var reason = "";
    var onlyExistingAttr = onlyExistingAttributes == undefined ? false : onlyExistingAttributes;
    if (points.length != dataValues.length) {
      return "Wrong number of returned points";
    }
    points.forEach(function(element, index) {
      if ((element.ts != dataValues[index].ts) ||
        !pointsEqual(element, dataValues[index]) ||
        !locEqual(dataValues[index], element, onlyExistingAttr) ||
        !attrEqual(dataValues[index], element, onlyExistingAttr)) {
        result = false;
        reason = "Point " + JSON.stringify(element) + " does not fit to expected value " +
          JSON.stringify(dataValues[index]);
      }
    });
    if (result === true) return true;
    else return reason;
  }

  var flattenArray = function(array, keys) {
    var results = array.map(function(element) {
      return element;
    });
    results = results
    .reduce(function(acc, cur) {
      return acc.concat(cur)
    })
    .filter((elem) => elem.component < componentId.length)
    return results;
  }

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
    }, [[Number.MIN_VALUE, Number.MAX_VALUE, 0, 0, 0], [Number.MIN_VALUE, Number.MAX_VALUE, 0, 0, 0]])
  }

  //********************* Main Object *****************//
  //---------------------------------------------------//
  return {
    "sendAggregatedDataPoints": function(done) {
      //To be independent of main tests, own sensors, actuators, and commands have to be created
      promtests.addComponent(componentNames[0], componentTypes[0], userToken, accountId, deviceId)
        .then((id) => {
          componentId[0] = id;
        })
        .then((id) => promtests.addComponent(componentNames[1], componentTypes[1], userToken, accountId, deviceId))
        .then((id) => {
          componentId[1] = id;
        })
        .then((id) => promtests.addComponent(componentNames[2], componentTypes[2], userToken, accountId, deviceId))
        .then((id) => {
          componentId[2] = id;
        })
        .then((id) => promtests.addComponent(componentNames[3], componentTypes[3], userToken, accountId, deviceId))
        .then((id) => {
          componentId[3] = id;
        })
        .then((id) => promtests.addComponent(componentNames[4], componentTypes[4], userToken, accountId, deviceId))
        .then((id) => {
          componentId[4] = id;
        })
        .then(() => {
          var proms = [];
          dataValues1Time = 0 + BASE_TIMESTAMP;
          dataValues1.forEach(function(element) {
            proms.push(promtests.submitDataList(element, deviceToken, accountId, deviceId, componentId))
          });
          return Promise.all(proms);
        })
        .then(() => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAggregatedDataPoints": function(done) {
      var listOfExpectedResults = flattenArray(dataValues1);
      promtests.searchData(dataValues1Time, -1, deviceToken, accountId, deviceId, componentId[0], false, {})
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
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
    "sendAggregatedMultipleDataPoints": function(done) {
      var proms = [];
      dataValues2Time = dataValues2[0][0].ts;
      dataValues2.forEach(function(element) {
        proms.push(promtests.submitDataList(element, deviceToken, accountId, deviceId, componentId, {}));
      });
      Promise.all(proms)
        .then(() => {
          done()
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAggregatedMultipleDataPoints": function(done) {
      var pValues = prepareValues(dataValues2);
      var foundComponentsMap = pValues.numComponents;
      var listOfExpectedResults = pValues.listOfExpectedResults;

      promtests.searchData(dataValues2Time, -1, deviceToken, accountId, deviceId, componentId, false, {})
        .then((result) => {
          if (result.series.length != componentId.length) {
            return done("Wrong number  of point series!");
          }
          //Mapping is needed because the results are not in sending order
          // e.g. component[0] could be now be in series[3]
          var err = 0;
          var mapping = findMapping(foundComponentsMap, componentId, result.series);
          Object.entries(mapping).forEach(function(element){
            var comparisonResult = comparePoints(listOfExpectedResults[element[0]], result.series[element[1]].points)
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
    "sendDataPointsWithLoc": function(done) {
      var proms = [];
      dataValues3Time = dataValues3[0][0].ts;
      dataValues3.forEach(function(element) {
        proms.push(promtests.submitDataList(element, deviceToken, accountId, deviceId, componentId));
      });
      Promise.all(proms)
        .then(() => {
          done()
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveDataPointsWithLoc": function(done) {
      var flattenedDataValues = flattenArray(dataValues3);
      promtests.searchData(dataValues3Time, -1, deviceToken, accountId, deviceId, componentId[0], true, {})
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          var comparisonResult = comparePoints(flattenedDataValues, result.series[0].points);
          if (comparisonResult !== true) {
            done(comparisonResult);
          } else {
            done();
          }
        })
        .catch((err) => {
          done(err);
        });

    },
    "sendDataPointsWithAttributes": function(done) {
      var proms = [];
      dataValues4Time = dataValues4[0][0].ts;
      dataValues4.forEach(function(element) {
        proms.push(promtests.submitDataList(element, deviceToken, accountId, deviceId, componentId));
      });
      Promise.all(proms)
        .then(() => {
          done()
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveDataPointsWithAttributes": function(done) {
      var pValues = prepareValues(dataValues4);
      var foundComponentMap = pValues.numComponents;
      var flattenedDataValues = pValues.flattenedDataValues;
      promtests.searchDataAdvanced(dataValues4Time, -1, deviceToken, accountId, deviceId, componentId, true, undefined, undefined, undefined)
        .then((result) => {
          var mapping = findMapping(foundComponentMap, componentId, result.data[0].components)
          if (result.data[0].components.length != componentId.length) {
            return done("Wrong number of point series!");
          }
          var err = false;
          var resultObjects = Object.entries(mapping).reduce((accum, mappingElem) => {
            var testresult =
            result.data[0].components[mappingElem[1]].samples.reduce((accum_inner, comp) => {
              accum_inner.push(createObjectFromData(comp,
                result.data[0].components[mappingElem[1]].samplesHeader));
                return accum_inner;
              }, [])
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
    "receiveDataPointsWithSelectedAttributes": function(done) {
      var keys = ["key1"];
      var pValues = prepareValues(dataValues4);
      var foundComponentMap = pValues.numComponents;
      var flattenedDataValues = flattenArray(dataValues4);
      promtests.searchDataAdvanced(dataValues4Time, -1, deviceToken, accountId, deviceId, componentId, false, keys, undefined, undefined)
        .then((result) => {
          if (result.data[0].components.length != 5) {
            return done("Wrong number of point series!");
          }
          var mapping = findMapping(foundComponentMap, componentId, result.data[0].components);
          var compIndex = 0;

          var err = false;
          var resultObjects = Object.entries(mapping).reduce((accum, mappingElem) => {
            if (mappingElem[1] < 0) {
              return accum;
            }
            var testresult =
            result.data[0].components[mappingElem[1]].samples.reduce((accum_inner, comp) => {
              accum_inner.push(createObjectFromData(comp,
                result.data[0].components[mappingElem[1]].samplesHeader));
                return accum_inner;
              }, [])
              return accum.concat(testresult);
            }, []);
          var comparisonResult = comparePoints(flattenedDataValues, resultObjects, true);
          if (comparisonResult !== true) {
            err = 1;
            return done(comparisonResult);
          } else if (!err){
            return done();
          }
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveDataPointsCount": function(done) {
      var expectedRowCount = flattenArray(dataValues1).length
        + flattenArray(dataValues2).length
        + flattenArray(dataValues3).length
        + flattenArray(dataValues4).length;
      promtests.searchDataAdvanced(dataValues1Time, -1, deviceToken, accountId, deviceId, componentId, false, undefined, undefined, true)
        .then((result) => {
          if (result.data[0].components.length != 5) {
            return done("Wrong number of point series!");
          }

          assert.equal(result.rowCount, expectedRowCount);
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAggregations": function(done) {
      var foundComponentMap = {0: 0, 1: 1}; // Only component 1 and 2 are numbers and can aggregate
      var aggr1 = calcAggregationsPerComponent(flattenArray(dataValues1));
      var aggr2 = calcAggregationsPerComponent(flattenArray(dataValues2));
      var aggr3 = calcAggregationsPerComponent(flattenArray(dataValues3));
      var aggr4 = calcAggregationsPerComponent(flattenArray(dataValues4));
      var allAggregation = [aggr1, aggr2, aggr3, aggr4].reduce(function(acc, val) {
        [0, 1].forEach(function(index) {
          if (acc[index][aggregation.MAX] < val[index][aggregation.MAX]) {
            acc[index][aggregation.MAX] = val[index][aggregation.MAX];
          }
          if (val[index][aggregation.COUNT]
            && acc[index][aggregation.MIN] > val[index][aggregation.MIN]) {
            acc[index][aggregation.MIN] = val[index][aggregation.MIN];
          }
          acc[index][aggregation.COUNT] += val[index][aggregation.COUNT];
          acc[index][aggregation.SUM] += val[index][aggregation.SUM];
          acc[index][aggregation.SUMOFSQUARES] += val[index][aggregation.SUMOFSQUARES];
        });
        return acc;
      }, [[Number.MIN_VALUE, Number.MAX_VALUE, 0, 0, 0], [Number.MIN_VALUE, Number.MAX_VALUE, 0, 0, 0]])

      promtests.searchDataAdvanced(dataValues1Time, -1, deviceToken, accountId, deviceId, componentId, false, undefined, "only", false)
        .then((result) => {
          if (result.data[0].components.length != 5) {
            return done("Wrong number of point series!");
          }
          var mapping = findMapping(foundComponentMap, componentId, result.data[0].components);
          [0, 1].forEach(function(index) {
            assert.closeTo(allAggregation[index][aggregation.MAX], result.data[0].components[mapping[index]].max, MIN_NUMBER);
            assert.closeTo(allAggregation[index][aggregation.MIN], result.data[0].components[mapping[index]].min, MIN_NUMBER);
            assert.closeTo(allAggregation[index][aggregation.COUNT], result.data[0].components[mapping[index]].count, MIN_NUMBER);
            assert.closeTo(allAggregation[index][aggregation.SUM], result.data[0].components[mapping[index]].sum, MIN_NUMBER);
            assert.closeTo(allAggregation[index][aggregation.SUMOFSQUARES], result.data[0].components[mapping[index]].sumOfSquares, MIN_NUMBER);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveSubset": function(done) {
      promtests.searchDataAdvanced(dataValues2Time + 30, dataValues2Time + 60, deviceToken, accountId, deviceId, [componentId[0]], false, undefined, undefined, false)
        .then((result) => {
          if (result.data[0].components.length != 1) done("Wrong number of point series!");
          assert.equal(result.rowCount, 3);
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "sendMaxAmountOfSamples": function(done) {
      var dataList = [];

      for (var i = 0; i < MAX_SAMPLES; i++) {
        var ts = (i + 1) * 1000000 + BASE_TIMESTAMP
        var obj = {
          component: 0,
          ts: ts,
          value: i
        }
        dataList.push(obj);
      }
      promtests.submitDataList(dataList, deviceToken, accountId, deviceId, componentId)
        .then(() => {
          done()
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveMaxAmountOfSamples": function(done) {
      promtests.searchDataAdvanced(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[0]], false, undefined, undefined, false)
        .then((result) => {
          if (result.data[0].components.length != 1) return done("Wrong number of point series!");
          assert.equal(result.rowCount, MAX_SAMPLES);
          var samples = result.data[0].components[0].samples;
          samples.forEach(function(element, i) {
            assert.equal(element[1], i);
            assert.equal(element[0], (i + 1) * 1000000 + BASE_TIMESTAMP);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "waitForBackendSynchronization": function(delay, done) {
      setTimeout(done, delay);

    },
    "sendPartiallyWrongData": function(done) {
      var proms = [];
      var codes = [];
      dataValues5StartTime = dataValues5[0][0].ts;
      var dataValues5lastElement = dataValues5[dataValues5.length - 1];
      var dataValues5lastLength = dataValues5[dataValues5.length - 1].length;
      dataValues5StopTime = dataValues5lastElement[dataValues5lastLength - 1].ts;
      var wrongId = uuidv4(); // 6th id is random
      dataValues5.forEach(function(element) {
        proms.push(promtests.submitDataList(element, deviceToken, accountId, deviceId, componentId.concat(wrongId), {}));
      });
      Promise.all(proms.map(p => p.catch(e => e)))
        .then(results => {
          var parsedResults = results.map( (result) => {
            //some results are string, some others objects
            //Therefore if parsing fails, it must be an object already
            try {
              return JSON.parse(result);
            } catch (e) {
              return result;
            }
          })
          assert.equal(parsedResults[0].code, 1412);
          assert.equal(parsedResults[1].code, 6402);
          assert.equal(parsedResults[2].code, 6402);
          done();
        })
        .catch(err => done(err));

    },
    "receivePartiallySentData": function(done) {
      var listOfExpectedResults = flattenArray(dataValues5)
      .filter((elem) => elem.component != 2);
      promtests.searchData(dataValues5StartTime, dataValues5StopTime, deviceToken, accountId, deviceId, componentId[0], false, {})
        .then((result) => {
          if (result.series.length != 1) {
            return done("Wrong number of point series!");
          }
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
    "sendDataAsAdmin": function(done) {
      dataValues6StartTime = dataValues6[0].ts;
      dataValues6StopTime = dataValues6[1].ts;
      var username = process.env.USERNAME;
      var password = process.env.PASSWORD;
      assert.isNotEmpty(username, "no username provided");
      assert.isNotEmpty(password, "no password provided");
      promtests.authGetToken(username, password)
      .then((grant) => promtests.submitDataListAsUser(dataValues6, grant.token, accountId, deviceId, componentId, {}))
      .then(() => {
        done()
      })
      .catch((err) => {
        done(new Error(err));
      })
    },
    "sendDataAsUser": function(done) {
      var username = process.env.USERNAME;
      var password = process.env.PASSWORD;
      var username2 = process.env.USERNAME2;
      var password2 = process.env.PASSWORD2;
      var admin2Token;
      var inviteId;
      assert.isNotEmpty(username, "no username provided");
      assert.isNotEmpty(password, "no password provided");
      assert.isNotEmpty(username2, "no username provided");
      assert.isNotEmpty(password2, "no password provided");
      //First create a user for the account, accept the invitation and try to send data
      promtests.authGetToken(username, password)
      .then((grant) => {return promtests.createInvitation(grant.token, accountId, username2)})
      .then((result) => {inviteId = result._id; return promtests.authGetToken(username2, password2)})
      .then((grant) => promtests.acceptInvitation(grant.token, accountId, inviteId))
      .then(() => promtests.authGetToken(username2, password2))
      .then((grant) => admin2Token = grant.token)
      .then(() => promtests.submitDataListAsUser(dataValues7,
        admin2Token, accountId, deviceId, componentId, {}).catch(e => e))
      .then((result) => {
        assert.equal(result, 'Access denied')
        done()
      })
      .catch((err) => {
        done(err);
      })
    },
    "sendDataAsAdminWithWrongAccount": function(done) {
      assert.isNotEmpty(username2, "no username provided");
      assert.isNotEmpty(password2, "no password provided");
      promtests.authGetToken(username2, password2)
      .then((grant) => {
        return promtests.createAccount(accountName2, grant.token)
      })
      .then(() => promtests.authGetToken(username2, password2))
      .then((grant) => userToken2 = grant.token)
      .then(() => promtests.authTokenInfo(userToken2))
      .then((tokenInfo) => {
        accountId2 = tokenInfo.payload.accounts[0].id;
        return accountId2;})
      .then((accountId2) =>
      promtests.submitDataListAsUser(dataValues7,
        userToken2, accountId2, deviceId, componentId, {}).catch(e => e))
      .then((result) => {
        var parsedResult = JSON.parse(result);
        assert.equal(parsedResult.code, 401)
        done()
      })
      .catch((err) => {
        done(err);
      })
    },
    "receiveDataFromAdmin": function(done) {
      var listOfExpectedResults = dataValues6;
      promtests.searchData(dataValues6StartTime, dataValues6StopTime, deviceToken, accountId, deviceId, componentId[0], false, {})
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
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
    "sendDataAsDeviceToWrongDeviceId": function(done) {
      var username = process.env.USERNAME;
      var password = process.env.PASSWORD;
      var newDeviceName = "innocentDevice";
      var componentName = "evilDeviceComponent";
      var componentType = componentTypes[0];
      assert.isNotEmpty(username, "no username provided");
      assert.isNotEmpty(password, "no password provided");
      //First create a user for the account, accept the invitation and try to send data
      promtests.authGetToken(username, password)
      .then((grant) => promtests.createDevice(newDeviceName, newDeviceId, grant.token, accountId))
      .then(() => promtests.activateDevice(userToken, accountId, newDeviceId))
      .then((result) => {
        return promtests.addComponent(componentName, componentType, userToken, accountId, newDeviceId)
      })
      .then((id) => {newComponentId = id;})
      .then(() => promtests.submitDataList(dataValues7,
        deviceToken, accountId, newDeviceId, newComponentId, {}).catch(e => e))
      .then((result) => {
        var parsedResult = JSON.parse(result);
        assert.equal(parsedResult.code, 401)
        done()
      })
      .catch((err) => {
        done(err);
      })
    },
    "send8000SamplesForAutoDownsampleTest": function(done) {
      var dataList = [ [], [], [], [], [], [], [], [] ];
      for (var j = 0; j < DOWNSAMPLE_MULT; j++) {
        for (var i = MAX_SAMPLES * j; i < MAX_SAMPLES * (j + 1); i++) {
          var ts = i * 1000  + BASE_TIMESTAMP + 1000000;
          var obj = {
            component: 1,
            ts: ts,
            value: i
          }
          dataList[j].push(obj);
        }
      }
      promtests.submitDataList(dataList[0], deviceToken, accountId, deviceId, componentId)
        .then(() => promtests.submitDataList(dataList[1], deviceToken, accountId, deviceId, componentId))
        .then(() => promtests.submitDataList(dataList[2], deviceToken, accountId, deviceId, componentId))
        .then(() => promtests.submitDataList(dataList[3], deviceToken, accountId, deviceId, componentId))
        .then(() => promtests.submitDataList(dataList[4], deviceToken, accountId, deviceId, componentId))
        .then(() => promtests.submitDataList(dataList[5], deviceToken, accountId, deviceId, componentId))
        .then(() => promtests.submitDataList(dataList[6], deviceToken, accountId, deviceId, componentId))
        .then(() => promtests.submitDataList(dataList[7], deviceToken, accountId, deviceId, componentId))
        .then(() => {
          done()
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveRawData": function(done) {
      promtests.searchData(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, componentId[1], false, {})
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          assert.equal(result.series[0].points.length, MAX_SAMPLES_RETRIVE);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.value, i);
            assert.equal(element.ts, i * 1000 + 1000000 + BASE_TIMESTAMP);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveMaxItems": function(done) {
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, MAX_ITEMS_TEST_SAMPLES)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          assert.equal(result.series[0].points.length, MAX_ITEMS_TEST_SAMPLES);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.value, i);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAutoAggregatedAvgData": function(done) {
      var aggregator = {};
      aggregator[componentId[1]] = {"name": "avg"};
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, null, null, aggregator)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          assert.equal(result.series[0].points.length, MAX_SAMPLES_RETRIVE);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.value, (i * 2) + 0.5);
            assert.equal(element.ts, (i * 2) * 1000 + 1000000 + BASE_TIMESTAMP);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAutoAggregatedMaxData": function(done) {
      var aggregator = {};
      aggregator[componentId[1]] = {"name": "max"};
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, null, null, aggregator)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          assert.equal(result.series[0].points.length, MAX_SAMPLES_RETRIVE);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.value, (i * 2) + 1);
            assert.equal(element.ts, (i * 2) * 1000 + 1000000 + BASE_TIMESTAMP);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAutoAggregatedMinData": function(done) {
      var aggregator = {};
      aggregator[componentId[1]] = {"name": "min"};
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, null, null, aggregator)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          assert.equal(result.series[0].points.length, MAX_SAMPLES_RETRIVE);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.value, (i * 2));
            assert.equal(element.ts, (i * 2) * 1000 + 1000000 + BASE_TIMESTAMP);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAutoAggregatedSumData": function(done) {
      var aggregator = {};
      aggregator[componentId[1]] = {"name": "sum"};
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, MAX_ITEMS_TEST_SAMPLES, null, aggregator)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          assert.equal(result.series[0].points.length, MAX_ITEMS_TEST_SAMPLES);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            var n = i * 8 + 8;
            var sum = (n * (n - 1)) / 2; // sum of all numbers up to n
            var old_sum = (n - 8) * (n - 9) / 2; // sum of previous n-8 round
            assert.equal(element.value, (sum - old_sum));
            old_sum = n;
            assert.equal(element.ts, (i * 8) * 1000 + 1000000 + BASE_TIMESTAMP);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAggregatedAvgData": function(done) {
      var aggregator = {};
      aggregator[componentId[1]] = {"name": "avg", "sampling": {"unit": "seconds", "value": 3}};
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, null, null, aggregator)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          var numExptectedSamples = Math.ceil(MAX_SAMPLES_RETRIVE/3.0);
          assert.equal(result.series[0].points.length, numExptectedSamples);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.ts, (i * 3) * 1000 + 1000000 + BASE_TIMESTAMP);
            if (i < numExptectedSamples - 1) {
              assert.equal(element.value, (i * 3) + 1);
            } else { // exception for last sample
              assert.equal(element.value, (i * 3));
            }
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAggregatedAvgData": function(done) {
      var aggregator = {};
      aggregator[componentId[1]] = {"name": "avg", "sampling": {"unit": "seconds", "value": 3}};
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, null, null, aggregator)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          var numExptectedSamples = Math.ceil(MAX_SAMPLES_RETRIVE/3.0);
          assert.equal(result.series[0].points.length, numExptectedSamples);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.ts, (i * 3) * 1000 + 1000000 + BASE_TIMESTAMP);
            if (i < numExptectedSamples - 1) {
              assert.equal(element.value, (i * 3) + 1);
            } else { // exception for last sample
              assert.equal(element.value, (i * 3));
            }
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAggregatedAvgDataMS": function(done) {
      var aggregator = {};
      aggregator[componentId[1]] = {"name": "avg", "sampling": {"unit": "milliseconds", "value": 1500}};
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, null, null, aggregator)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          var numExptectedSamples = Math.ceil(MAX_SAMPLES_RETRIVE/1.5);
          assert.equal(result.series[0].points.length, numExptectedSamples);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.ts, Math.round(i * 1.5) * 1000 + 1000000 + BASE_TIMESTAMP);
            if (i < numExptectedSamples - 1) {
              assert.equal(element.value, (i * 1.5) + 0.5);
            } else { // exception for last sample
              assert.equal(element.value, (i * 1.5));
            }
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAggregatedAvgDataMinutes": function(done) {
      var aggregator = {};
      aggregator[componentId[1]] = {"name": "avg", "sampling": {"unit": "minutes", "value": 1}};
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, null, null, aggregator)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          var numExptectedSamples = Math.ceil(MAX_SAMPLES_RETRIVE/60);
          assert.equal(result.series[0].points.length, numExptectedSamples);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.ts, Math.round(i * 60) * 1000 + 1000000 + BASE_TIMESTAMP);
            if (i < numExptectedSamples - 1) {
              assert.equal(element.value, (i * 60) + 29.5);
            } else { // exception for last sample
              assert.equal(element.value, (i * 60) + 19.5);
            }
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveRawDataDesc": function(done) {
      var orders = {};
      orders[componentId[1]] = "desc";
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, null, orders, null)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          assert.equal(result.series[0].points.length, MAX_SAMPLES_RETRIVE);
          var samples = result.series[0].points;
          samples.forEach(function(element, i) {
            assert.equal(element.value, 7999 - i);
            assert.equal(element.ts, (7999 - i) * 1000 + 1000000 + BASE_TIMESTAMP);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveRawDataLatest": function(done) {
      var orders = {};
      orders[componentId[1]] = "desc";
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1]], false, {}, 1, orders, null)
        .then((result) => {
          if (result.series.length != 1) return done("Wrong number of point series!");
          assert.equal(result.series[0].points.length, 1);
          var samples = result.series[0].points;
          var element = samples[0];
          assert.equal(element.value, 7999);
          assert.equal(element.ts, (7999) * 1000 + 1000000 + BASE_TIMESTAMP);
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAggregatedDataFromMultipleComponents": function(done) {
      var aggregator = {};
      aggregator[componentId[1]] = {"name": "avg"};
      aggregator[componentId[0]] = {"name": "max", "sampling": {"unit": "seconds", "value": 1000}};
      promtests.searchDataMaxItems(BASE_TIMESTAMP + 1000000, MAX_SAMPLES * DOWNSAMPLE_MULT * 1000 + 1000000 + BASE_TIMESTAMP, deviceToken, accountId, deviceId, [componentId[1], componentId[0]], false, {}, 100, null, aggregator)
        .then((result) => {
          if (result.series.length != 2) return done("Wrong number of point series!");
          // the ordering of components in the results are non-deterministic
          // so we have to permutate
          var perm = {};
          if (result.series[0].componentId == componentId[0]) {
            perm = {"0":0, "1":1};
          } else {
            perm = {"1": 0, "0": 1};
          }
          var numExptectedSamples = [9, 100]
          assert.equal(result.series[perm[0]].points.length, numExptectedSamples[0]);
          assert.equal(result.series[perm[1]].points.length, numExptectedSamples[1]);
          var samples = [result.series[perm[0]].points, result.series[perm[1]].points];
          samples[0].forEach(function(element, i) {
            assert.equal(element.ts, ((i + 1) *  1000000) + BASE_TIMESTAMP);
            assert.equal(element.value, i);
          })
          samples[1].forEach(function(element, i) {
            assert.equal(element.ts, (i * 1000 * 80) + 1000000 + BASE_TIMESTAMP);
            assert.equal(element.value, (i * 80) + 39.5);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "cleanup": function(done) {
      promtests.deleteComponent(userToken, accountId, deviceId, componentId[0])
        .then(() => promtests.deleteComponent(userToken, accountId, deviceId, componentId[1]))
        .then(() => promtests.deleteComponent(userToken, accountId, newDeviceId, newComponentId))
        .then(() => promtests.deleteDevice(userToken, accountId, newDeviceId))
        .then(() => promtests.deleteAccount(userToken2, accountId2))
        .then(() => promtests.deleteInvite(userToken, accountId, username2))
        .then(() => { done() })
        .catch((err) => {
          done(err);
        });
    }
  };
};

var descriptions = {
  "sendAggregatedDataPoints": "Shall send multiple datapoints for one component",
  "receiveAggregatedDataPoints": "Shall receive multiple datapoints for one component",
  "sendAggregatedMultipleDataPoints": "Shall send multiple datapoints for 4 components",
  "receiveAggregatedMultipleDataPoints": "Shall receive multiple datapoints for 4 components",
  "sendDataPointsWithLoc": "Sending data points with location metadata",
  "receiveDataPointsWithLoc": "Receiving data points with location metadata",
  "sendDataPointsWithAttributes": "Sending data points with attributes",
  "receiveDataPointsWithAttributes": "Receiving data points with all attributes",
  "receiveDataPointsCount": "Receive only count of points",
  "receiveAggregations": "Receive Max, Min, etc. aggregations",
  "receiveSubset": "receive subset based on timestamps",
  "sendMaxAmountOfSamples": "Send maximal allowed samples per request",
  "receiveMaxAmountOfSamples": "Receive maximal allowed samples per request",
  "receiveDataPointsWithSelectedAttributes": "Receiving data points with selected attributes",
  "waitForBackendSynchronization": "Waiting maximal tolerable time backend needs to flush so that points are available",
  "sendPartiallyWrongData": "Send data with partially unknown cid's",
  "receivePartiallySentData": "Recieve the submitted data of the partially wrong data",
  "sendDataAsAdmin": "Send test data as admin on behalf of a device",
  "sendDataAsUser": "Send test data with user role and get rejected",
  "sendDataAsAdminWithWrongAccount": "Send test data as admin with wrong accountId",
  "receiveDataFromAdmin": "Test whether data sent from admin earlier has been stored",
  "send8000SamplesForAutoDownsampleTest": "Send enough data to check auto downsample",
  "sendDataAsDeviceToWrongDeviceId": "Test whether Device data submission is rejected if it goes to wrong device",
  "receiveRawData": "Receive auto downsampled data",
  "receiveMaxItems": "Receive max requested items",
  "receiveAutoAggregatedAvgData": "Receive auto downsampled data with Avg aggregator",
  "receiveAggregatedAvgData": "Receive downsampled data with Avg aggregator and explicit second sampling",
  "receiveAutoAggregatedMaxData": "Receive auto downsampled data with Max aggregator",
  "receiveAutoAggregatedMinData": "Receive auto downsampled data with Min aggregator",
  "receiveAutoAggregatedSumData": "Receive auto downsampled data with Min aggregator",
  "receiveAggregatedAvgDataMS": "Receive downsampled data with milliseconds",
  "receiveAggregatedAvgDataMinutes": "Receive downsampled data with minutes",
  "receiveRawDataDesc": "Receive data in desc order",
  "receiveRawDataLatest": "Receive latest data",
  "receiveAggregatedDataFromMultipleComponents": "Receive multiple aggregated components",
  "cleanup": "Cleanup components, commands, rules created for subtest"
};

module.exports = {
  test: test,
  descriptions: descriptions
};
