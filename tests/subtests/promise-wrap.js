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
/*jshint esversion: 6 */
/*jshint undef: true, unused: true */
/* jshint node: true */

"use strict";


var helpers = require("../lib/helpers");


var checkObservations = function(tempValues, cid, cbManager, deviceToken, accountId, deviceId, componentParamName, waitBetweenSendingSamples=0){
    var firstObservationTime;
    return new Promise((resolve, reject) => {
	var index = 0;
	var nbActuations = 0;
	process.stdout.write("    ");

	tempValues
	    .forEach( (value) => {
		value.ts = null;
		if (value.expectedActuation !== null) {
		    nbActuations++;
		}
	    });
	var step;
	var sendObservationAndCheckRules = function(index) {
	    process.stdout.write(".".green);

            if (tempValues[index].hasOwnProperty('delay')){
                setTimeout(sendActualObservation, tempValues[index].delay);
            }
            else{
                sendActualObservation();
            }
            function sendActualObservation(){
                helpers.devices.submitData(tempValues[index].value, deviceToken, accountId, deviceId, cid, function(err, ts) {
                    tempValues[index].ts = ts;

                    if (index === 0) {
                        firstObservationTime = tempValues[index].ts;
                    }
                    if (err) {
                        reject(err);
                    }

                    if (tempValues[index].expectedActuation === null) {
                        setTimeout(step, waitBetweenSendingSamples);
                    }
                });
            }
        };
	step = function(){
	    index++;
	    if (index === tempValues.length) {
		process.stdout.write("\n");
		if (nbActuations === 0){
		    resolve();
		}
		else reject(new Error("Wrong number of actuations"));
	    } else {
		sendObservationAndCheckRules(index);
	    }
	};

	var actuationCallback = function(message) {
	    --nbActuations;
	    var expectedActuationValue = tempValues[index].expectedActuation.toString();
	    var componentParam = message.content.params.filter(function(param){
		return param.name === componentParamName;
	    });
	    if(componentParam.length === 1)
	    {
		var param = componentParam[0];
		var paramValue = param.value.toString();

		if(paramValue === expectedActuationValue)
		{
		    step();
		}
		else
		{
		    reject(new Error("Param value wrong. Expected: " + expectedActuationValue + " Received: " + paramValue));
		}
	    }
	    else
	    {
		reject(new Error("Did not find component param: " + componentParamName));
	    }
	};
	cbManager.set(actuationCallback);


	sendObservationAndCheckRules(index);
    });
};

var addComponent = (componentName, componentType, deviceToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
	helpers.devices.addDeviceComponent(componentName, componentType, deviceToken, accountId, deviceId, function(err, id) {
	    if (err) {
		reject(err);
	    } else {
		resolve(id);
	    }
	});
    });
};
var addActuator = (actuatorName, actuatorType, deviceToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
	helpers.devices.addDeviceComponent(actuatorName, actuatorType, deviceToken, accountId, deviceId, function(err, id) {
	    if (err) {
		reject(err);
	    } else {
		resolve(id);
	    }
	});
    });
};
var createCommand = (cmdName, componentParamName, onOff, userToken, accountId, deviceId, actuatorId) => {
    return new Promise(function(resolve, reject){
	helpers.control.saveComplexCommand(cmdName, componentParamName, onOff, userToken, accountId, deviceId, actuatorId, function(err,response) {
	    if (err) {
		reject(err);
	    } else {
		if (response.status !== 'OK') {
		    reject(new Error("Wrong status: " + response.status));
		}
		else {
		    resolve();
		}
	    }
	});
    });
};
var createStatisticRule = (rule, userToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
	helpers.rules.createStatisticRule(rule, userToken, accountId, deviceId, function(err, id) {
	    if (err) {
		reject(err);
	    } else {
		rule.id = id;
		resolve();
	    }
	});
    });
};

var createTbRule = (rule, userToken, accountId, deviceId) => {
    return new Promise(function(resolve, reject){
	helpers.rules.createTbRule(rule, userToken, accountId, deviceId, function(err, id) {
	    if (err) {
		reject(err);
	    } else {
		rule.id = id;
		resolve();
	    }
	});
    });
};

var deleteComponent = function(userToken, accountId, deviceId, componentId){
    return new Promise((resolve, reject) => {
	helpers.devices.deleteDeviceComponent (userToken, accountId, deviceId, componentId, function(err, response){
	    if (err) {
		reject(err);
	    } else {
		resolve(response);
	    }
	});
    });
};
var deleteRule = function(userToken, accountId, ruleId){
    return new Promise((resolve, reject) => {
	helpers.rules.deleteRule (userToken, accountId, ruleId, function(err, response){
	    if (err) {
		reject(err);
	    } else {
		resolve(response);
	    }
	});
    });
};

var submitDataList = function(valueList, deviceToken, accountId, deviceId, cidList){
    return new Promise((resolve, reject) => {
	helpers.data.submitDataList(valueList, deviceToken, accountId, deviceId, cidList, function(err, response){
	    if (err) {
		reject(err);
	    } else {
		resolve(response);
	    }
	});
    });
}


var submitData = function(value, deviceToken, accountId, deviceId, cid){
    return new Promise((resolve, reject) => {
	helpers.data.submitData(value, deviceToken, accountId, deviceId, cid, function(err, response){
	    if (err) {
		reject(err);
	    } else {
		resolve(response);
	    }
	});
    });
}


var searchData = function(from, to, userToken, accountId, deviceId, cid, queryMeasureLocation, targetFilter){
    return new Promise((resolve, reject) => {
	helpers.data.searchData(from, to, userToken, accountId, deviceId, cid, queryMeasureLocation, targetFilter, function(err, response){
	    if (err) {
		reject(err);
	    } else {
		resolve(response);
	    }
	});
    });
}


var searchDataAdvanced = function(from, to, userToken, accountId, deviceId, cidList, showMeasureLocation, returnedMeasureAttributes, aggregations, countOnly){
    return new Promise((resolve, reject) => {
	helpers.data.searchDataAdvanced(from, to, userToken, accountId, deviceId, cidList, showMeasureLocation, returnedMeasureAttributes, aggregations, countOnly, function(err, response){
	    if (err) {
		reject(err);
	    } else {
		resolve(response);
	    }
	});
    });
}

module.exports = {
    checkObservations: checkObservations,
    addComponent: addComponent,
    addActuator: addActuator,
    createCommand: createCommand,
    createStatisticRule: createStatisticRule,
    createTbRule: createTbRule,
    deleteComponent: deleteComponent,
    deleteRule: deleteRule,
    submitDataList: submitDataList,
    submitData: submitData,
    searchData: searchData,
    searchDataAdvanced: searchDataAdvanced
};
