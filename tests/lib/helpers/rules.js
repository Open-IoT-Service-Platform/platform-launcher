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


var uuid = require('uuid/v4');

var chai = require('chai');
var assert = chai.assert;

var config = require("../../test-config.json");
var oispSdk = require("@open-iot-service-platform/oisp-sdk-js");
var api = oispSdk(config).api.rest;


function getRules(userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }
    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.rules.getRules(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            cb(null,response)
        }
    });
} 

function getRuleDetails(userToken, accountId, ruleId, cb) {
    if (!cb) {
        throw "Callback required";
    }
    var data = {
        userToken: userToken,
        accountId: accountId,
        ruleId: ruleId
    };

    api.rules.getRuleDetails(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            if ( response.id == ruleId ) {
                {
                    cb(null, response.synchronizationStatus == "Sync" ? true : false)
                }
            }
            else {
                cb("rule "+ruleId + " not found ");
            }
        }
    });
} 

function createRule(ruleConfig, userToken, accountId, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,

        body: {
            name: ruleConfig.name,
            description: "OISP testing rule",
            priority: "Medium",
            type: "Regular",
            status: "Active",
            resetType: "Automatic",
            synchronizationStatus: "NotSync",

            actions: ruleConfig.actions,

            population: {
                ids: [deviceId],
                attributes: null,
                tags: null
            },

            conditions: {
                operator: "OR",
                values: [{
                    component: {
                        dataType: "Number",
                        name: ruleConfig.conditionComponent,
                        cid: ruleConfig.cid
                    },
                    type: "basic",
                    values: [ruleConfig.basicConditionValue.toString()],
                    operator: ruleConfig.basicConditionOperator
                }]
            }
        }
    };


    api.rules.createRule(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            var ruleId = response.id;
            var syncInterval = setInterval( function(id) {
                getRuleDetails(userToken, accountId, ruleId, function(err, status) {
                    if (err) {
                        clearInterval(syncInterval);
                        cb(err)
                    }
                    else {
                        if ( status == true ) {
                            clearInterval(syncInterval);
                            cb(null, ruleId)
                        }
                    }
                })
            }, 500)
        }
    });

}

function createStatisticRule(ruleConfig, userToken, accountId, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,

        body: {
            name: ruleConfig.name,
            description: "OISP testing rule",
            priority: "Medium",
            type: "Regular",
            status: "Active",
            resetType: "Automatic",
            synchronizationStatus: "NotSync",

            actions: ruleConfig.actions,

            population: {
                ids: [deviceId],
                attributes: null,
                tags: null
            },

            conditions: {
                operator: "OR",
                values: [{
                    component: {
                        dataType: "Number",
                        name: ruleConfig.conditionComponent,
                        cid: ruleConfig.cid
                    },
                    type: "statistics",
                    values: [ruleConfig.statisticConditionValue.toString()],
                    operator: ruleConfig.statisticConditionOperator,
		    baselineCalculationLevel: "Device level",
		    baselineMinimalInstances: ruleConfig.statisticMinimalInstances,
		    baselineSecondsBack: ruleConfig.statisticSecondsBack
                }]
            }
        }
    };

    api.rules.createRule(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            var ruleId = response.id;
            var syncInterval = setInterval( function(id) {
                getRuleDetails(userToken, accountId, ruleId, function(err, status) {
                    if (err) {
                        clearInterval(syncInterval);
                        cb(err)
                    }
                    else {
                        if ( status == true ) {
                            clearInterval(syncInterval);
                            cb(null, ruleId)
                        }
                    }
                })
            }, 500)
            
        }
    });

}

function updateRule(ruleConfig, userToken, accountId, ruleId, cb) {
    if (!cb) {
        throw "Callback required";
    }
    
    var data = {
        userToken: userToken,
        accountId: accountId,
        ruleId: ruleId,
        body: {
            name: ruleConfig.name,
            description: "OISP testing rule new",
            priority: "Medium",
            type: "Regular",
            status: "Active",
            resetType: "Automatic",
            synchronizationStatus: ruleConfig.synchronizationStatus,

            actions: [{
                type: "actuation",
                target: [
                    ruleConfig.actuationCmd
                ]
            }],


            population: {
                ids: ['00-11-22-33-44-55'],
                attributes: null,
                tags: null
            },

            conditions: {
                operator: "OR",
                values: [{
                    component: {
                        dataType: "Number",
                        name: ruleConfig.conditionComponent,
                        cid: ruleConfig.cid
                    },
                    type: "basic",
                    values: [ruleConfig.basicConditionValue.toString()],
                    operator: ruleConfig.basicConditionOperator
                }]
            }
        }
    };


    api.rules.updateRule(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            cb(null,response)
        }
    });
} 


function updateRuleStatus(userToken, accountId, ruleId, status, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        ruleId: ruleId,
        body:{
            status:status
        } 
    };

    api.rules.updateRuleStatus(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            cb(null,response)
        }
    });
}


function createDraftRule (draftname, userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,

        body: {
            priority: null,
            type: null,
            resetType: null,
            name: draftname,
            synchronizationStatus: "NotSync",
            
            actions:[{
                type:"mail",
                target:[]
            }],
            population:{
                name:null,
                ids:[],
                tags:[],
                attributes:null
            },
            conditions: {
                operator: null,
                values: []
            }
        }
    };

    api.rules.createDraftRule(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
           cb(null, response)
        }
    });

}


function cloneRule (userToken, accountId, ruleId , cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        ruleId: ruleId
    };

    api.rules.cloneRule(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
           cb(null, response)
        }
    });

}

function deleteDraftRule (userToken, accountId,ruleId , cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        ruleId: ruleId
    };

    api.rules.deleteDraftRule(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
           cb(null, response)
        }
    });

}

function deleteRule (userToken, accountId,ruleId , cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        ruleId: ruleId
    };

    api.rules.deleteRule(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
           cb(null, response)
        }
    });

}

module.exports={
    createRule:createRule,
    createStatisticRule:createStatisticRule,
    getRules: getRules,
    getRuleDetails: getRuleDetails,
    updateRule: updateRule,
    updateRuleStatus: updateRuleStatus,
    createDraftRule: createDraftRule,
    cloneRule: cloneRule,
    deleteDraftRule: deleteDraftRule,
    deleteRule: deleteRule
}
