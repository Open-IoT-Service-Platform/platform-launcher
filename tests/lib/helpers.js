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
var Imap = require('imap');
var assert = chai.assert;

var config = require("../test-config.json");
var oispSdk = require("@open-iot-service-platform/oisp-sdk-js");
var api = oispSdk(config).api.rest;

function createComponentId() {
    return uuid();
}

function getActivationCode(accountId, userToken, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.accounts.refreshAccountActivationCode(data, function(err, response) {
        cb(err, response.activationCode)
    })
}

function login(username, password, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        body: {
            username: username,
            password: password
        }
    };

    api.auth.getAuthToken(data, function(err, response) {
        var userToken = null;

        if (!err) {
            assert.isString(response.token, "no access token retrieved");
            if (response.token) {
                userToken = response.token;
            }
        }
        cb(err, userToken);
    })
}

function wsConnect(connector, deviceToken, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var deviceInfo = {
        device_id: deviceId,
        device_token: deviceToken
    };

    connector.updateDeviceInfo(deviceInfo)

    var data = {
        deviceId: deviceId
    };

    connector.controlCommandListen(data, cb, function() {});
}


function createAccount(name, userToken, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        body: {
            name: name
        }
    };

    api.accounts.createAccount(data, function(err, response) {
        if (!err) {
            assert.equal(response.name, name, "accounts name is wrong");
            assert.isString(response.id, "Account id not returned");

            cb(null, response.id);
        }
        else {
            cb(err);
        }
    });
}

function createDevice(name, deviceId, userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: {
            name: name,
            deviceId: deviceId,
            gatewayId: "00-11-22-33-44-55"
        }
    };

    api.devices.createDevice(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            cb(null, deviceId);
        }
    });
}

function activateDevice(userToken, accountId, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    getActivationCode(accountId, userToken, function(err, activationCode) {
        if (err) {
            cb(err);
        } else {
            var data = {
                userToken: userToken,
                accountId: accountId,
                deviceId: deviceId,
                body: {
                    activationCode: activationCode
                }
            };

            api.devices.activateDevice(data, function(err, response) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, response.deviceToken);
                }
            })
        }
    })
}

function createComponent(name, type, userToken, accountId, deviceId, force, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var cid = createComponentId();

    var data = {
        userToken: userToken,
        accountId: accountId,
        deviceId: deviceId,
        body: {
            name: name,
            type: type,
            cid: cid
        }
    };

    api.devices.addDeviceComponent(data, function(err, response) {
        if (err) {
            cb(null);
        } else {
            cb(null, response.cid);
        }
    });
}


function createCommand(name, paramName, value, userToken, accountId, deviceId, actId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        commandName: name,
        body: {
            commands: [{
                componentId: actId,
                transport: "ws",
                parameters: [{
                    name: paramName,
                    value: value.toString()
                }]
            }]
        },
        deviceId: deviceId
    };

    api.control.saveComplexCommand(data, function(err, response) {
        cb(err);
    });
}

function isRuleSynchronized(userToken, accountId, ruleId, cb) {
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
                isRuleSynchronized(userToken, accountId, ruleId, function(err, status) {
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

function sendObservation(value, deviceToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var ts = new Date().getTime();

    var data = {
        deviceToken: deviceToken,
        deviceId: deviceId,
        body: {
            accountId: accountId,
            on: ts,
            data: [{
                componentId: cid,
                value: value.toString(),
                on: ts
            }]
        }
    }

    api.devices.submitData(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            cb(null, ts);
        }
    })

}

function getActuationsForComponent(from, maxItems, deviceToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        from: from,
        deviceToken: deviceToken,
        accountId: accountId,
        deviceId: deviceId
    };
    
    api.control.pullActuations(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            var actuations = [];

            for (var i = 0; i < response.length; i++) {
                if (response[i].componentId == cid) {
                    if (actuations.length < maxItems) {
                        actuations.push(response[i].parameters[0].value);
                    } else {
                        break;
                    }
                }
            }

            cb(null, actuations)
        }
    })

}


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

function getData(from, userToken, accountId, deviceId, cid, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body: {
            from: from,
            targetFilter: {
                deviceList: [deviceId]
            },
            metrics: [{
                id: cid
            }]
        }
    };

    api.data.searchData(data, function(err, response) {
        if (err) {
            cb(err)
        } else {
            if (response.series) {
                cb(null, response.series[0].points)
            }
        }
    });
}

function getEmailMessage(user, password, host, port, num, cb) {
    if (!cb) {
        throw "Callback required";
    }
    var imap = new Imap({
        user: user,
        password: password,
        host: host,
        port: port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', function() {
        imap.openBox('INBOX', true, function(err, box) {
            if ( !err ) {
                var f = imap.seq.fetch(num, {
                            bodies: ['HEADER.FIELDS (TO)', '1'],
                            struct: true
                        });

                f.on('message', function(msg, seqno) {
                    var buffer = '';
                    msg.on('body', function(stream, info) {

                        stream.on('data', function(chunk) {
                            buffer += chunk.toString('utf8');
                        });
                    });

                    msg.once('end', function() {
                        buffer = buffer.replace("&lt;","<");
                        buffer = buffer.replace("&gt;",">");
                        cb(null, buffer);
                        imap.closeBox(() => {
                                                imap.destroy();
                                                imap.end();
                                            });
                    });
                });
            }
            else {
                cb(err);
            }
        });
    });

    imap.once('error', function(err) {
        cb(err);
    });

    imap.connect();

}


module.exports = {
    createComponentId: createComponentId,
    getActivationCode: getActivationCode,
    login: login,
    wsConnect: wsConnect,
    createAccount: createAccount,
    createDevice: createDevice,
    activateDevice: activateDevice,
    createComponent: createComponent,
    createCommand: createCommand,
    createRule: createRule,
    sendObservation: sendObservation,
    getActuationsForComponent: getActuationsForComponent,
    getObservation: getObservation,
    getData: getData,
    getEmailMessage: getEmailMessage
};
