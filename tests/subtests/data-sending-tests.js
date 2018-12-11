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
  var componentNames = ["temperature-sensor-sdt", "humidity-sensor-sdt"];
  var componentTypes = ["temperature.v1.0", "humidity.v1.0"];
  var promtests = require('./promise-wrap');
  var rules = [];
  var componentId = [];
  var dataValues1Time;
  var dataValues2Time;
  var dataValues3Time;
  var dataValues4Time;
  const MIN_NUMBER = 0.0001;
  const MAX_SAMPLES = 1000;
  const BASE_TIMESTAMP = 1000000000000

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
      loc: [9.8765, 432.1, 09.876]
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
    }]
  ];

  var aggregation = {
    MAX: 0,
    MIN: 1,
    COUNT: 2,
    SUM: 3,
    SUMOFSQUARES: 4
  }

  var createObjectFromData = function(sample, sampleHeader){
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
        if (element[el] !== undefined && element[el] != dataValue.attributes[el]){
          result = false;
        }
      }
    })
  }
  return result;
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
        ((Math.abs(element.value - dataValues[index].value)) > MIN_NUMBER) ||
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

  var flattenArray = function(array) {
    var results = array.map(function(element) {
      return element;
    });
    results = results.reduce(function(acc, cur) {
      return acc.concat(cur)
    })
    return results;
  }

  var calcAggregationsPerComponent = function(flattenedArray){

    return flattenedArray.reduce(function(acc, val) {
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
      promtests.addComponent(componentNames[0], componentTypes[0], deviceToken, accountId, deviceId)
        .then((id) => {
          componentId[0] = id;
        })
        .then((id) => promtests.addComponent(componentNames[1], componentTypes[1], deviceToken, accountId, deviceId))
        .then((id) => {
          componentId[1] = id;
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
          if (result.series.length != 1) done("Wrong number of point series!");
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

      var flattenedDataValues = flattenArray(dataValues2);
      var listOfExpectedResults = [];
      listOfExpectedResults[0] = flattenedDataValues.filter(
        (element) => (element.component == 0)
      );
      listOfExpectedResults[1] = flattenedDataValues.filter(
        (element) => (element.component == 1)
      );
      promtests.searchData(dataValues2Time, -1, deviceToken, accountId, deviceId, componentId, false, {})
        .then((result) => {
          if (result.series.length != 2) done("Wrong number of point series!");
          var mapping = [0, 1];
          if (result.series[0].componentId !== componentId[0]) {
            mapping = [1, 0];
          }

          var comparisonResult = comparePoints(listOfExpectedResults[mapping[0]], result.series[0].points)
          if (comparisonResult !== true) {
            done(comparisonResult);
          }
          var listOfExpectedResults1 = flattenedDataValues.filter(
            (element) => (element.component == 1)
          );
          comparisonResult = comparePoints(listOfExpectedResults[mapping[1]], result.series[1].points);
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
          if (result.series.length != 1) done("Wrong number of point series!");
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
      var flattenedDataValues = flattenArray(dataValues4);
      promtests.searchDataAdvanced(dataValues4Time, -1, deviceToken, accountId, deviceId, componentId, true, undefined, undefined, undefined)
        .then((result) => {
          if (result.data[0].components.length != 2) done("Wrong number of point series!");
          var compIndex = 0;
          if (result.data[0].components[1].componentId == componentId[1]) {
            compIndex = 1;
          }
          var resultObjects = result.data[0].components[compIndex].samples.map(
            (element) =>
            createObjectFromData(element, result.data[0].components[compIndex].samplesHeader)
          );
          var comparisonResult = comparePoints(flattenedDataValues, resultObjects);
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
    "receiveDataPointsWithSelectedAttributes": function(done) {
      var flattenedDataValues = flattenArray(dataValues4);
      promtests.searchDataAdvanced(dataValues4Time, -1, deviceToken, accountId, deviceId, [componentId[1]], false, ["key1"], undefined, undefined)
        .then((result) => {
          if (result.data[0].components.length != 1) done("Wrong number of point series!");
          var compIndex = 0;

          var resultObjects = result.data[0].components[compIndex].samples.map(
            (element) =>
            createObjectFromData(element, result.data[0].components[compIndex].samplesHeader)
          );
          var comparisonResult = comparePoints(flattenedDataValues, resultObjects, true);
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
    "receiveDataPointsCount": function(done) {
      var expectedRowCount = flattenArray(dataValues1).length
        + flattenArray(dataValues2).length
        + flattenArray(dataValues3).length
        + flattenArray(dataValues4).length;
      promtests.searchDataAdvanced(dataValues1Time, -1, deviceToken, accountId, deviceId, componentId, false, undefined, undefined, true)
        .then((result) => {
          if (result.data[0].components.length != 2) done("Wrong number of point series!");

          assert.equal(result.rowCount, expectedRowCount);
          done();
        })
        .catch((err) => {
          done(err);
        });
    },
    "receiveAggregations": function(done) {
      var aggr1 = calcAggregationsPerComponent(flattenArray(dataValues1));
      var aggr2 = calcAggregationsPerComponent(flattenArray(dataValues2));
      var aggr3 = calcAggregationsPerComponent(flattenArray(dataValues3));
      var aggr4 = calcAggregationsPerComponent(flattenArray(dataValues4));
      var allAggregation = [aggr1, aggr2, aggr3, aggr4].reduce(function(acc, val){
        [0, 1].forEach(function(index){
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
      },[[Number.MIN_VALUE, Number.MAX_VALUE, 0, 0, 0], [Number.MIN_VALUE, Number.MAX_VALUE, 0, 0, 0]])

      promtests.searchDataAdvanced(dataValues1Time, -1, deviceToken, accountId, deviceId, componentId, false, undefined, "only", false)
        .then((result) => {
          if (result.data[0].components.length != 2) done("Wrong number of point series!");
          var mapping = [0, 1];
          if (result.data[0].components[0].componentId !== componentId[0]) {
            mapping = [1, 0];
          }
          [0, 1].forEach(function(index){
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

      for (var i = 0; i < MAX_SAMPLES; i++){
        var ts = (i + 1) * 1000000 + BASE_TIMESTAMP
        var obj = {
          component:0,
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
          if (result.data[0].components.length != 1) done("Wrong number of point series!");
          assert.equal(result.rowCount, MAX_SAMPLES);
          var samples = result.data[0].components[0].samples;
          samples.forEach(function(element, i){
              assert.equal(element[1], i);
              assert.equal(element[0], (i + 1) * 1000000 + BASE_TIMESTAMP);
          })
          done();
        })
        .catch((err) => {
          done(err);
        });
      },
      "waitForBackendSynchronization": function(done) {
        setTimeout(done, 2000);

      },
      "cleanup": function(done) {
        promtests.deleteComponent(deviceToken, accountId, deviceId, componentId[0])
        .then(() => promtests.deleteComponent(deviceToken, accountId, deviceId, componentId[1]))
        .then(() => {done()})
        .catch((err) => {
          done(err);
        });
      }
    };
};

var descriptions = {
  "sendAggregatedDataPoints": "Shall send multiple datapoints for one component",
  "receiveAggregatedDataPoints": "Shall receive multiple datapoints for one component",
  "sendAggregatedMultipleDataPoints": "Shall send multiple datapoints for 2 components",
  "receiveAggregatedMultipleDataPoints": "Shall receive multiple datapoints for 2 components",
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
  "cleanup": "Cleanup components, commands, rules created for subtest"
};

module.exports = {
  test: test,
  descriptions: descriptions
};