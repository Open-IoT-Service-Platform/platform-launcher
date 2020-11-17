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

var uuid = require('uuid/v4');

var chai = require('chai');
var assert = chai.assert;

var config = require("../../test-config.json");
var oispSdk = require("@open-iot-service-platform/oisp-sdk-js");
var api = oispSdk(config).api.rest;


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
            gatewayId: "00-11-22-33-44-55",
            tags: ["tag-a", "tag-b"],
            attributes: {
                os: "linux"
            }
        }
    };

    api.devices.createDevice(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            assert.notEqual(response, null, 'response is null');
            cb(null, response);
        }
    });
}

function getDevices(userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
    };

    api.devices.getDevices(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            assert.notEqual(response, null, 'response is null');
            cb(null, response);
        }
    });
}

function getDeviceDetails(userToken, accountId, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        deviceId: deviceId
    };

    api.devices.getDeviceDetails(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            assert.notEqual(response, null, 'response is null');
            cb(null, response);
        }
    });
}

function updateDeviceDetails(userToken, accountId, deviceId, deviceInfo, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        deviceId: deviceId,
        body:deviceInfo
    };

    api.devices.updateDeviceDetails(data, function(err, response) {
        if (err) {
            cb(err, null);
        }
        else {
            assert.notEqual(response, null, 'response is null');
            cb(null, response);
        }
    });
}

function getAccountActivationCode(accountId, userToken, cb) {
    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.accounts.getAccountActivationCode(data, function(err, response) {
        if(!err){
            assert.notEqual(response.activationCode, null ,'activation code is null');
            cb(null,response.activationCode);
        }
        else{
            cb(err);
        }
    });
}

function activateDevice(userToken, accountId, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    getAccountActivationCode(accountId, userToken, function(err, activationCode) {
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
                    assert.notEqual(response, null, 'response is null');
                    cb(null, response);
                }
            });
        }
    });
}

function activateDeviceWithoutToken(activationCode, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }
    var data = {
        deviceId: deviceId,
        body: {
            activationCode: activationCode
        }
    };
    api.devices.registerDevice(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            assert.notEqual(response, null, 'response is null');
            cb(null, response);
        }
    });
}

function createComponentId() {
    return uuid();
}

function addDeviceComponent(name, type, userToken, accountId, deviceId, cb) {
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
            cb(err);
        } else {
            assert.notEqual(response, null, 'response is null');
            cb(null, response.cid);
        }
    });
}

function submitData(value, deviceToken, accountId, deviceId, cid, cb) {
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
                value: Buffer.isBuffer(value) ? value : value.toString(),
                on: ts
            }]
        }
    };
    api.devices.submitData(data, function(err) {
        if (err) {
            cb(err);
        } else {
            cb(null, ts);
        }
    });

}



function deleteDeviceComponent (userToken, accountId,deviceId, cid , cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        deviceId: deviceId,
        cid: cid
    };

    api.devices.deleteDeviceComponent(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });

}

function deleteDevice (userToken, accountId, deviceId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        deviceId: deviceId
    };

    api.devices.deleteDevice(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });

}

function getDeviceTags (userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.devices.getDeviceTags(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });

}

function getDeviceAttributes (userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId
    };

    api.devices.getDeviceAttributes(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });

}

function countDevices (userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        body:{
            "status":{
                "operator":"OR"
            },
            "components":{
                "operator":"OR"
            }
        }
    };

    api.devices.countDevices(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });

}

function searchDevices (userToken, accountId, cb) {
    if (!cb) {
        throw "Callback required";
    }

    var data = {
        userToken: userToken,
        accountId: accountId,
        limit: 10,
        skip: 0,
        body:{
            "status":{
                "operator":"OR"
            },
            "components":{
                "operator":"OR"
            }
        }
    };

    api.devices.searchDevices(data, function(err, response) {
        if (err) {
            cb(err);
        } else {
            cb(null, response);
        }
    });
}

module.exports = {
    createDevice: createDevice,
    getDevices: getDevices,
    getDeviceDetails: getDeviceDetails,
    updateDeviceDetails: updateDeviceDetails,
    activateDevice: activateDevice,
    activateDeviceWithoutToken: activateDeviceWithoutToken,
    addDeviceComponent: addDeviceComponent,
    submitData: submitData,
    deleteDevice: deleteDevice,
    deleteDeviceComponent: deleteDeviceComponent,
    getDeviceTags: getDeviceTags,
    getDeviceAttributes: getDeviceAttributes,
    countDevices: countDevices,
    searchDevices: searchDevices
};
