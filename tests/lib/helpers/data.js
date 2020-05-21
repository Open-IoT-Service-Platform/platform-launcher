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

//-------------------------------------------------------------------------------------------------------
// Helper Functions
//-------------------------------------------------------------------------------------------------------

var chai = require('chai');
var assert = chai.assert;

var config = require("../../test-config.json");
var oispSdk = require("@open-iot-service-platform/oisp-sdk-js");
var api = oispSdk(config).api.rest;




function getObservation(ts, userToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: {
            from: ts,
            targetFilter: {
                deviceList: [deviceId]
            },
            metrics: [{
                id: cid
            }]
        }
    }
    api.data.searchData(data, function(err, response) {
        var found = false;
        if (err) {
            cb(err);
        } else {
            if (response.series) {
                for (var i = 0; i < response.series.length; i++) {
                    for (var j = 0; j < response.series[i].points.length; j++) {
                        if (response.series[i].points[j].ts == ts) {
                            found = true;
                            cb(null, ts, parseInt(response.series[i].points[j].value));
                            break;
                        }
                    }
                }
            }

            if (!found) {
                cb(null, ts, null);
            }
        }
    });
}

function searchData(from, to, userToken, accountId, deviceId, cid, queryMeasureLocation, targetFilter, cb) {
  searchDataMaxItems(from, to, userToken, accountId, deviceId, cid, queryMeasureLocation, targetFilter, null, null, null, cb)
}

function searchDataMaxItems(from, to, userToken, accountId, deviceId, cids, queryMeasureLocation, targetFilter, maxItems, orders, aggregators, cb) {
  if (!cb) {
      throw "Callback required";
  }
  if (!Array.isArray(cids)) {
    cids = [cids];
  }

  var  metrics = cids.map((element) => {
   var metric = {"id": element};
   if (orders && orders[element] != undefined && orders[element] != null) {
     metric.order = orders[element];
   }
   if (aggregators && aggregators[element] != undefined  && aggregators[element] != null) {
     metric.aggregator = aggregators[element];
   }
   return metric;
  });

  if (targetFilter == undefined) {
    targetFilter = {}
  }
  if (targetFilter.deviceList == undefined) {
    targetFilter.deviceList = [deviceId];
  } else {
    if (targetFilter.deviceList.indexOf(deviceId) == -1) {
      targetFilter.deviceList.push(deviceId);
    }
  }

  var data = {
      userToken: userToken,
      accountId: accountId,
      body: {
          from: from,
          targetFilter: targetFilter,
          metrics: metrics,
          queryMeasureLocation: queryMeasureLocation
      }
  };

  if (maxItems != null) {
    data.body.maxItems = maxItems
  }
  if (to !== undefined && to > 0) {
    data.body.to = to;
  }
  api.data.searchData(data, function(err, response) {
      if (err) {
          cb(err)
      } else {
          cb(null, response)
      }
  });
}


function submitData(value, deviceToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }
    var ts = new Date().getTime();

    var data = {
        userToken: deviceToken,
        deviceId: deviceId,
        body: {
            accountId: accountId,
            on: ts,
            data: [{
                componentId: cid,
                value: Buffer.isBuffer(value) ? value : value.toString(),
                on: ts
            }]
        }
    }

    api.data.submitData(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            if (response) {
                cb(null, response)
            }
        }
    });
}

function submitDataList(valueList, deviceToken, accountId, deviceId, cidList, cb) {
    if (!cb) {
        throw "Callback required";
    }
    var ts = new Date().getTime();

    var data = {
        userToken: deviceToken,
        deviceId: deviceId,
        body: {
            accountId: accountId,
            on: valueList[0].ts,
            data: []
        }
    }

    valueList.forEach(function(element){
      var toPush = {
        componentId: cidList[element.component],
        value: (typeof element.value === 'string' || Buffer.isBuffer(element.value)) ? element.value : element.value.toString(),
        on: element.ts
      }
      if (element.loc) {
        toPush.loc = element.loc;
      }
      if (element.attributes !== undefined){
        toPush.attributes = element.attributes;
      }
      data.body.data.push(toPush);
    });
    api.data.submitData(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            if (response) {
                cb(null, response)
            }
        }
    });
}

function submitDataListAsUser(valueList, userToken, accountId, deviceId, cidList, cb) {
    if (!cb) {
        throw "Callback required";
    }
    var ts = new Date().getTime();

    var data = {
        userToken: userToken,
        accountId: accountId,
        deviceId: deviceId,
        body: {
            accountId: accountId,
            on: valueList[0].ts,
            data: []
        }
    }

    valueList.forEach(function(element){
      var toPush = {
        componentId: cidList[element.component],
        value: (typeof element.value === 'string' || Buffer.isBuffer(element.value)) ? element.value : element.value.toString(),
        on: element.ts
      }
      if (element.loc) {
        toPush.loc = element.loc;
      }
      if (element.attributes !== undefined){
        toPush.attributes = element.attributes;
      }
      data.body.data.push(toPush);
    });
    api.data.submitDataAsUser(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            if (response) {
                cb(null, response)
            }
        }
    });
}

function searchDataAdvanced(from, to, userToken, accountId, deviceIds, cidList, showMeasureLocation, returnedMeasureAttributes, aggregations, countOnly, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: {
            deviceIds: deviceIds,
            from: from,
            showMeasureLocation: showMeasureLocation,
            componentIds: cidList
        }
    };

    if (returnedMeasureAttributes !== undefined && returnedMeasureAttributes != []) {
      data.body.returnedMeasureAttributes = returnedMeasureAttributes;
    }
    if (aggregations !== undefined && aggregations != "") {
      data.body.aggregations = aggregations;
    }
    if (countOnly !== undefined) {
      data.body.countOnly = countOnly;
    }
    if (to != undefined) {
      data.body.to = to;
    }

    api.data.searchDataAdvanced(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            assert.notEqual(response, null, 'response is null')
            cb(null, response)
        }
    });
}

module.exports={
    getObservation: getObservation,
    searchData: searchData,
    searchDataMaxItems: searchDataMaxItems,
    submitData: submitData,
    submitDataList: submitDataList,
    submitDataListAsUser: submitDataListAsUser,
    searchDataAdvanced: searchDataAdvanced
}
