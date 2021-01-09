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
'use strict';

const chai = require('chai');
const assert = chai.assert;
const colors = require('colors'); // jshint ignore:line

const config = require('./test-config.json');
const mqttConfig = require('./test-config-mqtt.json');
const oispSdk = require('@open-iot-service-platform/oisp-sdk-js');
const proxyConnector = oispSdk(config).lib.proxies.getControlConnector('ws');
const mqttConnector = oispSdk(mqttConfig).lib.proxies.getProxyConnector('mqtt');
const kafka = require('kafka-node');
const helpers = require('./lib/helpers');
const promtests = require('./subtests/promise-wrap');
const Gm = require('gm').subClass({imageMagick: true});
const {Data, Rule, Component, Components} = require('./lib/common');

const accountName = 'oisp-tests';
const deviceName = 'oisp-tests-device';

const actuatorName = 'powerswitch-actuator';
const actuatorType = 'powerswitch.v1.0';

const switchOnCmdName = 'switch-on';
const switchOffCmdName = 'switch-off';


const emailRecipient = 'test.receiver@streammyiot.com';

const imap_username = process.env.IMAP_USERNAME;
const imap_password = process.env.IMAP_PASSWORD;

const BACKEND_DELAY = 5000;
const BACKEND_TIMEOUT = 12000;
const GENERIC_TIMEOUT = 15000;
const TIMEOUT_FACTOR = 2;
// Use this to keep track of received mails and wait for new ones
// instead of deleting old mails
let nr_mails = helpers.mail.getAllEmailMessages().length;

// @description Checks whether variables are set. returns true if one of the
// variables are set
// @params skipifset []string array of case names in test-config.json under skip.
// The last one set to "true" or "false" preceeds, so the order should be from general
// to specific.
const checkTestCondition = function(skipifset) {
    let found = false;
    skipifset.forEach(function(caseName) {
        if (config.skip[caseName] === 'true') {
	    found = true;
        } else if (config.skip[caseName] === 'false') {
	    found = false;
        } else if (config.skip[caseName] !== '') {
	    console.error('config.skip.' + caseName + ' must be "true", "false" or ""');
	    process.exit(1);
        }
    });
    return found;
};

// -------------------------------------------------------------------------------------------------------
// Rules
// -------------------------------------------------------------------------------------------------------
const lowTemperatureRule = new Rule('oisp-tests-rule-low-temp', '<=', 15);
lowTemperatureRule.addAction('actuation', switchOnCmdName);
lowTemperatureRule.addAction('mail', emailRecipient);

const highTemperatureRule = new Rule('oisp-tests-rule-high-temp', '>', 25);
highTemperatureRule.addAction('actuation', switchOffCmdName);
highTemperatureRule.addAction('mail', emailRecipient);

function boolData() {
    const data = [
        new Data('1', null, null),
        new Data('0', null, null),
        new Data('1', null, null),
    ];
    return data;
}

function boolCheckData(sentData, receivedData) {
    var i = 0;
    if ( sentData.length === receivedData.length) {
        for (i = 0; i < sentData.length; i++) {
            if (sentData[i].ts === receivedData[i].ts && sentData[i].value === receivedData[i].value) {
                sentData[i].ts = null;
            }
        }
    }

    let err = null;
    for (i = 0; i < sentData.length; i++) {
        if (sentData[i].ts !== null) {
            err += '[' + i + ']=' + sentData[i].value + ' ';
        }
    }
    if (err) {
        err = 'Got wrong data for ' + err;
    }
    return err;
}

function stringData() {
    const data = [
        new Data('{}', null, null),
        new Data('{value: "hello world"}', null, null),
        new Data('{meta: "Camera1", enabled: true, numObjects: 23, calibration: 1.4}', null, null),
    ];
    return data;
}

function stringCheckData(sentData, receivedData) {
    var i = 0;
    if ( sentData.length === receivedData.length) {
        for (i = 0; i < sentData.length; i++) {
            if (sentData[i].ts === receivedData[i].ts && sentData[i].value === receivedData[i].value) {
                sentData[i].ts = null;
            }
        }
    }

    let err = null;
    for (i = 0; i < sentData.length; i++) {
        if (sentData[i].ts !== null) {
            err += '[' + i + ']=' + sentData[i].value + ' ';
        }
    }
    if (err) {
        err = 'Got wrong data for ' + err;
    }
    return err;
}

function temperatureData(componentName) {
    const data = [
        new Data(-15, 1, componentName + ' <= 15'),
        new Data( -5, 1, componentName + ' <= 15'),
        new Data( 5, 1, componentName + ' <= 15'),
        new Data( 15, 1, componentName + ' <= 15'),
        new Data( 25, null, null),
        new Data( 30, 0, componentName + ' > 25'),
        new Data( 20, null, null),
        new Data( 14, 1, componentName + ' <= 15'),
        new Data( 20, null, null),
        new Data( 28, 0, componentName + ' > 25'),
    ];

    return data;
}

function temperatureCheckData(sentData, receivedData) {
    var i = 0;
    if ( sentData.length === receivedData.length) {
        for (i = 0; i < sentData.length; i++) {
            if (sentData[i].ts === receivedData[i].ts && sentData[i].value === receivedData[i].value) {
                sentData[i].ts = null;
            }
        }
    }

    let err = null;
    for (i = 0; i < sentData.length; i++) {
        if (sentData[i].ts !== null) {
            err += '[' + i + ']=' + sentData[i].value + ' ';
        }
    }
    if (err) {
        err = 'Got wrong data for ' + err;
    }

    return err;
}


function imageData(componentName, opaque, cb) {
    if (!cb) {
        throw 'Callback required';
    }

    const images = [
        new Gm(100, 200, 'red'),
        new Gm(400, 600, 'white'),
        new Gm(500, 720, 'blue'),
    ];

    images.forEach(function(image) {
        image.toBuffer('RGB', function(err, buffer) {
            if (!err) {
                cb(opaque, new Data(buffer, null, null));
            }
        });
    });

    return null;
}


function imageCheckData(sentData, receivedData) {
    var i = 0;
    if (sentData.length === receivedData.length) {
        for (i = 0; i < sentData.length; i++) {
            if (sentData[i].ts === receivedData[i].ts &&
                sentData[i].value.equals(receivedData[i].value)) {
                sentData[i].ts = null;
            }
        }
    }

    let err = null;
    for (i = 0; i < sentData.length; i++) {
        if (sentData[i].ts !== null) {
            err += i + ' ';
        }
    }
    if (err) {
        err = 'Got wrong data for items' + err;
    }

    return err;
}

// -------------------------------------------------------------------------------------------------------
// Components
// -------------------------------------------------------------------------------------------------------
const components = new Components();

components.add( new Component('temperatures', 'Number', 'float', 'Degress Celsius', 'timeSeries', -150, 150,
    [lowTemperatureRule, highTemperatureRule],
    temperatureData, temperatureCheckData),
);

components.add( new Component('images', 'ByteArray', 'image/jpeg', 'pixel', 'binaryDataRenderer', null, null,
    [],
    imageData, imageCheckData),
);

components.add(new Component('metaData', 'String', 'JSON', 'text', 'binaryDataRenderer', null, null,
    [],
    stringData, stringCheckData),
);

components.add(new Component('binaryState', 'Boolean', 'state', 'bool', 'timeSeries', null, null,
    [],
    boolData, boolCheckData),
);

// -------------------------------------------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------------------------------------------
let userToken;
let userToken2;
let receiverToken;
let receiveruserId;
let receiveraccountId;
let userId;
let userId2;
let accountId;
let deviceId;
let deviceToken;
let actuatorId;
let rulelist;
let componentParamName;
let firstObservationTime;

const getNewUserTokens = function(done) {
    const username = process.env.USERNAME;
    const password = process.env.PASSWORD;
    const username2 = process.env.USERNAME2;
    const password2 = process.env.PASSWORD2;
    return promtests.authGetToken(username, password).then((grant) => {
        userToken = grant.token;
        return promtests.authGetToken(username2, password2);
    }).then((grant) => {
        userToken2 = grant.token;
        done();
    }).catch((err) => {
        done(err);
    });
};

process.stdout.write('_____________________________________________________________________\n'.bold);
process.stdout.write('                                                                     \n');
process.stdout.write('                           OISP E2E TESTING                          \n'.green.bold);
process.stdout.write('_____________________________________________________________________\n'.bold);

const CbManager = function() {
    let wssCB = null;
    return {
    	cb: function(message) {
    	    wssCB(message);
        },
    	set: function(newCB) {
            wssCB = newCB;
        },
    };
};

// Callback for WSS
const cbManager = new CbManager();


describe('Waiting for OISP services to be ready ...\n'.bold, function() {
    before(function(done) {
        userToken = null;
        userToken2 = null;
        accountId = null;
        deviceId = '00-11-22-33-44-55';
        deviceToken = null;
        actuatorId = null;
        rulelist = null;
        componentParamName = 'LED';
        firstObservationTime = null;

        done();
    });

    it('Shall wait for oisp services to start', function(done) {
        let kafkaConsumer;
        const topic = config['connector']['kafka']['topic'];
        const partition = 0;
        const kafkaAddress = config['connector']['kafka']['host'] + ':' + config['connector']['kafka']['port'];
        const kafkaClient = new kafka.KafkaClient({kafkaHost: kafkaAddress});
        const kafkaOffset = new kafka.Offset(kafkaClient);

        var getKafkaOffset = function(topic_, partition_, cb) {
            kafkaOffset.fetchLatestOffsets([topic_], function(error, offsets) {
                if (!error) {
                    cb(offsets[topic_][partition_]);
                } else {
                    setTimeout( function() {
                        getKafkaOffset(topic_, partition_, cb);
                    }, 1000);
                }
            });
        };

        getKafkaOffset(topic, partition, function(offset) {
            if ( offset >= 0 ) {
                const topics = [{topic: topic, offset: offset+1, partition: partition}];
                const options = {autoCommit: true, fromOffset: true};

                kafkaConsumer = new kafka.Consumer(kafkaClient, topics, options);

                const oispServicesToMonitor = ['rules-engine'];
                process.stdout.write('    ');
                kafkaConsumer.on('message', function(message) {
                    process.stdout.write('.'.green);
                    if ( kafkaConsumer ) {
                        let i=0;
                        for (i=0; i<oispServicesToMonitor.length; i++) {
                            if ( oispServicesToMonitor[i] != null && oispServicesToMonitor[i].trim() === message.value.trim() ) {
                                oispServicesToMonitor[i] = null;
                            }
                        }
                        for (i=0; i<oispServicesToMonitor.length; i++) {
                            if ( oispServicesToMonitor[i] != null ) {
                                break;
                            }
                        }
                        if ( i === oispServicesToMonitor.length ) {
                            kafkaConsumer.close(true);
                            kafkaConsumer = null;
                            process.stdout.write('\n');
                            done();
                        }
                    }
                });
            } else {
                done(new Error('Cannot get Kafka offset '));
            }
        });
    }).timeout(1000*60*1000);
});

describe('get authorization and manage user ...\n'.bold, function() {
    it('Shall authenticate', function(done) {
        const username = process.env.USERNAME;
        const password = process.env.PASSWORD;

        const username2 = process.env.USERNAME2;
        const password2 = process.env.PASSWORD2;

        assert.isNotEmpty(username, 'no username provided');
        assert.isNotEmpty(password, 'no password provided');
        assert.isNotEmpty(username2, 'no username2 provided');
        assert.isNotEmpty(password2, 'no password2 provided');

        getNewUserTokens(done);
    }).timeout(10000);

    it('Shall get token info', function(done) {
        helpers.auth.tokenInfo(userToken, function(err, response) {
            if (err) {
                done(new Error('Cannot get token info: ' + err));
            } else {
                assert.equal(response.header.typ, 'JWT', 'response type error' );
                if (response.payload.sub == null) {
                    done(new Error('get null user id'));
                } else {
                    userId = response.payload.sub;
                }
                helpers.auth.tokenInfo(userToken2, function(err, response) {
                    if (err) {
                        return done(err);
                    }
                    userId2 = response.payload.sub;
                    done();
                });
            }
        });
    });

    it('Shall get user information', function(done) {
        helpers.users.getUserInfo(userToken, userId, function(err, response) {
            if (err) {
                done(new Error('Cannot get user information : ' + err));
            } else {
                assert.isString(response.id);
                done();
            }
        });
    });

    it('Shall update user information', function(done) {
        const newuserInfo = {
            attributes: {
                'phone': '12366666666',
                'another_attribute': 'another_value',
                'new': 'next_string_value',
            },
        };

        helpers.users.updateUserInfo(userToken, userId, newuserInfo, function(err, response) {
            if (err) {
                done(new Error('Cannot update user information : ' + err));
            } else {
                assert.equal(response.status, 'OK', 'status error');
                done();
            }
        });
    });
});

describe('Creating account and device ...\n'.bold, function() {
    let accountInfo;

    it('Shall create account', function(done) {
        assert.notEqual(userToken, null, 'Invalid user token');
        helpers.accounts.createAccount(accountName, userToken, function(err, response) {
            if (err) {
                done(new Error('Cannot create account: ' + err));
            } else {
                assert.equal(response.name, accountName, 'accounts name is wrong');
                accountId = response.id;
                getNewUserTokens(done);
            }
        });
    }).timeout(10000);

    it('Shall get account info', function(done) {
        helpers.accounts.getAccountInfo(accountId, userToken, function(err, response) {
            if (err) {
                done(new Error('Cannot get account info: ' + err));
            } else {
                accountInfo = response;
                done();
            }
        });
    });

    it('Shall update an account', function(done) {
        accountInfo.attributes = {
            'phone': '123456789',
            'another_attribute': 'another_value',
            'new': 'next_string_value',
        };

        helpers.accounts.updateAccount(accountId, userToken, accountInfo, function(err, response) {
            if (err) {
                done(new Error('Cannot update account: ' + err));
            } else {
                assert.deepEqual(response.attributes, accountInfo.attributes, 'new attributes not being updated');
                done();
            }
        });
    });

    it('Shall get account activation code', function(done) {
        helpers.accounts.getAccountActivationCode(accountId, userToken, function(err) {
            if (err) {
                done(new Error('Cannot get account activation code: ' + err));
            } else {
                done();
            }
        });
    });

    it('Shall refresh account activation code', function(done) {
        helpers.accounts.refreshAccountActivationCode(accountId, userToken, function(err) {
            if (err) {
                done(new Error('Cannot refresh account activation code: ' + err));
            } else {
                done();
            }
        });
    });

    it('Shall list all users for account', function(done) {
        helpers.accounts.getAccountUsers(accountId, userToken, function(err) {
            if (err) {
                done(new Error('Cannot list users for account: ' + err));
            } else {
                done();
            }
        });
    });

    it('Shall create device', function(done) {
        assert.notEqual(accountId, null, 'Invalid account id');

        helpers.devices.createDevice(deviceName, deviceId, userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('Cannot create device: ' + err));
            } else {
                assert.equal(response.deviceId, deviceId, 'incorrect device id');
                assert.equal(response.name, deviceName, 'incorrect device name');
                done();
            }
        });
    });

    it('Shall get a list of all devices', function(done) {
        helpers.devices.getDevices(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('Cannot get list of devices: ' + err));
            } else {
                assert.equal(response[0].deviceId, deviceId, 'incorrect device id');
                done();
            }
        });
    });

    it('Shall update info of a device', function(done) {
        const deviceInfo = {
            gatewayId: deviceId,
            name: deviceName,
            loc: [45.12345, -130.654321, 121.1],
            tags: ['tag001', 'tag002'],
            attributes: {
                vendor: 'intel',
                platform: 'x64',
                os: 'linux',
            },
        };
        helpers.devices.updateDeviceDetails(userToken, accountId, deviceId, deviceInfo, function(err, response) {
            if (err) {
                done(new Error('Cannot update device info: ' + err));
            } else {
                assert.notEqual(response, null, 'response is null');
                assert.deepEqual(response.attributes, deviceInfo.attributes, 'device info is not updated');
                done();
            }
        });
    });

    it('Shall list all tags for device', function(done) {
        helpers.devices.getDeviceTags(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('Cannot list all tags for device ' + err));
            } else {
                assert.equal(response.length, 2, 'error tag numbers');
                done();
            }
        });
    });

    it('Shall list all attributes for device', function(done) {
        const attributes = {
            vendor: ['intel'],
            platform: ['x64'],
            os: ['linux'],
        };
        helpers.devices.getDeviceAttributes(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('Cannot list all attributes for device ' + err));
            } else {
                assert.deepEqual(response, attributes, 'get wrong device attributes');
                done();
            }
        });
    });

    it('Shall count devices based on filter', function(done) {
        helpers.devices.countDevices(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('Cannot count devices ' + err));
            } else {
                assert.equal(response.device.total, 1, 'count devices wrong');
                done();
            }
        });
    });

    it('Shall search devices based on filter', function(done) {
        helpers.devices.searchDevices(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('Cannot search devices ' + err));
            } else {
                assert.equal(response[0].deviceId, deviceId, 'search wrong device');
                done();
            }
        });
    });

    it('Shall activate device', function(done) {
        assert.notEqual(deviceId, null, 'Invalid device id');

        helpers.devices.activateDevice(userToken, accountId, deviceId, function(err, response) {
            if (err) {
                done(new Error('Cannot activate device ' + err));
            } else {
                assert.isString(response.deviceToken, 'device token is not string');
                deviceToken = response.deviceToken;
                helpers.connector.wsConnect(proxyConnector, deviceToken, deviceId, cbManager.cb);
                done();
            }
        });
    }).timeout(5000);

    it('Shall get detail of one device', function(done) {
        helpers.devices.getDeviceDetails(userToken, accountId, deviceId, function(err, response) {
            if (err) {
                done(new Error('Cannot get detail of device: ' + err));
            } else {
                assert.equal(response.deviceId, deviceId, 'incorrect device id');
                assert.deepEqual(response.attributes,
                    {'vendor': 'intel', 'platform': 'x64', 'os': 'linux'},
                    'incorrect device attributes' );
                done();
            }
        });
    });
});

describe('Device Activation Subtests'.bold, function() {
    let test;
    const descriptions = require('./subtests/device-activation-tests').descriptions;
    it(descriptions.prepareSetup, function(done) {
        test = require('./subtests/device-activation-tests').test(userToken, accountId);
        test.prepareSetup(done);
    }).timeout(10000);
    it(descriptions.activateExistingDeviceWithoutToken, function(done) {
        test.activateExistingDeviceWithoutToken(done);
    }).timeout(10000);
    it(descriptions.activateAnotherDeviceWithSameIdInAnotherAccount, function(done) {
        test.activateAnotherDeviceWithSameIdInAnotherAccount(done);
    }).timeout(10000);
    it(descriptions.activateNotExistingDeviceWithoutToken, function(done) {
        test.activateNotExistingDeviceWithoutToken(done);
    }).timeout(10000);
    it(descriptions.cleanup, function(done) {
        test.cleanup(done);
    }).timeout(10000);
});


describe('Refresh Token Subtests'.bold, function() {
    let test;
    const descriptions = require('./subtests/refresh-token-tests').descriptions;
    it(descriptions.getRefreshTokensForDeviceAndUser, function(done) {
        test = require('./subtests/refresh-token-tests')
            .test(process.env.USERNAME, process.env.PASSWORD, userToken, accountId, deviceId);
        test.getRefreshTokensForDeviceAndUser(done);
    }).timeout(10000);
    it(descriptions.refreshTokensForDeviceAndUser, function(done) {
        test.refreshTokensForDeviceAndUser(done);
    }).timeout(10000);
});


describe('Managing components catalog ... \n'.bold, function() {
    it('Shall create new custom Components Types', function(done) {
        var createCatalog = function(component) {
            if ( component ) {
                helpers.cmpcatalog.createCatalog(userToken, accountId, component.catalog, function(err) {
                    if (err) {
                        done(new Error('Cannot create component: ' + err));
                    } else {
                        // component.cId = response.id;
                        //  assert.equal(response.id, component.cId, 'cannot create new component type')
                        createCatalog(component.next);
                    }
                });
            } else {
                done();
            }
        };
        createCatalog(components.first);
    }).timeout(10000);

    it('Shall list all component types for account', function(done) {
        helpers.cmpcatalog.getCatalog(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('Cannot create component: ' + err));
            } else {
                assert.equal(response.length, components.size + 3, 'get wrong number of components ');
                done();
            }
        });
    }).timeout(10000);

    it('Shall get component type details', function(done) {
        var getCatalogDetail = function(component) {
            if ( component ) {
                if ( component.catalog.max ) {
                    helpers.cmpcatalog.getCatalogDetail(userToken, accountId, component.cId, function(err, response) {
                        if (err) {
                            done(new Error('Cannot get component type details ' + err));
                        } else {
                            assert.equal(response.id, component.cId, 'cannot get component '+component.name);
                            assert.equal(response.max, component.catalog.max);
                            getCatalogDetail(component.next);
                        }
                    });
                } else {
                    getCatalogDetail(component.next);
                }
            } else {
                done();
            }
        };
        getCatalogDetail(components.first);
    }).timeout(10000);

    it('Shall update a component type', function(done) {
        var updateCatalog = function(component) {
            if ( component ) {
                if ( component.catalog.min != null &&
                     component.catalog.max != null ) {
                    const newmin = 10;
                    const newmax = 1000;

                    helpers.cmpcatalog.updateCatalog(userToken, accountId, component.cId, newmin, newmax, function(err, response) {
                        if (err) {
                            done(new Error('Cannot get component type details ' + err));
                        } else {
                            if ( component.upgradeVersion() === false ) {
                                done(new Error('Cannot upgrade version for component ' + component.name));
                            }
                            assert.equal(response.id, component.cId, 'cannot update '+component.name+' component to '+component.catalog.version);
                            assert.equal(response.max, newmax);
                            updateCatalog(component.next);
                        }
                    });
                } else {
                    updateCatalog(component.next);
                }
            } else {
                done();
            }
        };
        updateCatalog(components.first);
    }).timeout(10000);
});

describe('Creating and getting components ... \n'.bold, function() {
    it('Shall add device a component', function(done) {
        var addDeviceComponent = function(component) {
            if ( component ) {
                helpers.devices.addDeviceComponent(component.name, component.type, userToken, accountId, deviceId, function(err, id) {
                    if (err) {
                        done(new Error('Cannot create component  ' + component + ' : ' +err));
                    } else {
                        if ( id ) {
                            component.id = id;
                            addDeviceComponent(component.next);
                        } else {
                            done(new Error('Wrong id for component  ' + component ));
                        }
                    }
                });
            } else {
                done();
            }
        };
        addDeviceComponent(components.first);
    }).timeout(10000);

    it('Shall not add device a component with the name that a component of the device already has, or crash', function(done) {
        var addDeviceComponent = function(component) {
            if ( component ) {
                helpers.devices.addDeviceComponent(component.name, component.type, userToken, accountId, deviceId, function(err, id) {
                    if (err) {
                        addDeviceComponent(component.next);
                    } else {
                        done(new Error('No error is thrown and the component is added successfully: ' + id));
                    }
                });
            } else {
                done();
            }
        };
        addDeviceComponent(components.first);
    }).timeout(10000);

    it('Shall add device an actuator', function(done) {
        helpers.devices.addDeviceComponent(actuatorName, actuatorType, userToken, accountId, deviceId, function(err, id) {
            if (err) {
                done(new Error('Cannot create actuator: ' + err));
            } else {
                actuatorId = id;
                done();
            }
        });
    }).timeout(10000);

    it('Shall create switch-on actuation command', function(done) {
        assert.notEqual(actuatorId, null, 'Invalid actuator id');

        helpers.control.saveComplexCommand(switchOnCmdName, componentParamName, 1, userToken, accountId, deviceId, actuatorId, function(err, response) {
            if (err) {
                done(new Error('Cannot create switch-on command: ' + err));
            } else {
                assert.equal(response.status, 'OK', 'get error response status');
                done();
            }
        });
    }).timeout(10000);

    it('Shall create switch-off actuation command', function(done) {
        assert.notEqual(actuatorId, null, 'Invalid actuator id');

        helpers.control.saveComplexCommand(switchOffCmdName, componentParamName, 0, userToken, accountId, deviceId, actuatorId, function(err, response) {
            if (err) {
                done(new Error('Cannot create switch-off command: ' + err));
            } else {
                assert.equal(response.status, 'OK', 'get error response status');
                done();
            }
        });
    }).timeout(10000);

    it('Shall send an actuation', function(done) {
        const actuationValue = 1;
        helpers.control.sendActuationCommand(componentParamName, actuationValue, userToken, accountId, actuatorId, deviceId, function(err, response) {
            if (err) {
                done(new Error('Cannot send an actuation: ' + err));
            } else {
                assert.equal(response.status, 'OK', 'cannot send an actuation');
                let actuationReceived = false;
                cbManager.set(function(message) {
                    const expectedActuationValue = actuationValue;
                    const componentParam = message.content.params.filter(function(param) {
                        return param.name === componentParamName;
                    });
                    if (componentParam.length === 1) {
                        const param = componentParam[0];
                        const paramValue = param.value.toString();
                        if (parseInt(paramValue) !== expectedActuationValue) {
                            done(new Error('Param value wrong. Expected: ' + expectedActuationValue + ' Received: ' + paramValue));
                        } else {
                            actuationReceived = true;
                        }
                    } else {
                        done(new Error('Did not find component param: ' + componentParamName));
                    }
                });
                const checkActuation = function() {
                    if (actuationReceived) {
                        done();
                    } else {
                        done(new Error('Actuation timed out after sending actuation command'));
                    }
                };
                setTimeout(checkActuation, 5000);
            }
        });
    }).timeout(10000);

    it('Shall get list of actuations', function(done) {
        const parameters = {
            from: 0,
            to: undefined,
        };

        helpers.control.pullActuations(parameters, userToken, accountId, deviceId, actuatorId, function(err, response) {
            if (err) {
                done(new Error('get list of actuations: ' + err));
            } else {
                assert.equal(response[0].componentId, actuatorId, 'pull error actuations');
                done();
            }
        });
    }).timeout(20000);
});


describe('Creating rules ... \n'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential'])) {
            this.skip();
        }
    });
    it('Shall create rules', function(done) {
        let nbRules = 0;
        components.list.forEach(function(component) {
            nbRules += component.rules.length;
        });

        if ( nbRules > 0 ) {
            components.list.forEach(function(component) {
                component.rules.forEach(function(rule) {
                    rule.cid = component.id;
                    rule.conditionComponent = component.name;
                    helpers.rules.createRule(rule, userToken, accountId, deviceId, 'Automatic', function(err, id) {
                        if (err) {
                            done(new Error('Cannot create rule ' + rule.name + ': ' + err));
                        } else {
                            rule.id = id;
                            if ( --nbRules === 0 ) {
                                done();
                            }
                        }
                    });
                });
            });
        } else {
            done();
        }
    }).timeout(20000);


    it('Shall get all rules', function(done) {
        helpers.rules.getRules(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('Cannot get rules ' + err));
            } else {
                components.list.forEach(function(component) {
                    if ( component.hasOwnProperty('rules') ) {
                        component.rules.forEach(function(rule) {
                            let found = false;
                            for (let i=0; i<response.length; i++) {
                                if ( rule.name === response[i].name ) {
                                    found = true;
                                    break;
                                }
                            }
                            if ( !found ) {
                                done(new Error('rule ' + rule.name + ' not found'));
                            }
                        });
                    }
                });
                rulelist = response;
                done();
            }
        });
    }).timeout(20000);
});

describe('Sending observations and checking rules ...\n'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'data_sending'])) {
            this.skip();
        }
    });

    it('Shall send observation and check rules', function(done) {
        assert.notEqual(proxyConnector, null, 'Invalid websocket proxy connector');

        let curComponent = null;
        components.reset();

        var sendObservationAndCheckRules;

        const step = function(component) {
            component.dataIndex++;
            if ( component.dataIndex === component.data.length) {
                process.stdout.write('\n');
                component = component.next;
            }

            sendObservationAndCheckRules(component);
        };

        let actuationCounter = 0;
        sendObservationAndCheckRules = function(component) {
            if ( component ) {
                if ( curComponent !== component ) {
                    process.stdout.write('\t' + component.type.blue + '\n');
                }
                curComponent = component;
                if (component.dataIndex === 0) {
                    process.stdout.write('\t');
                }
                process.stdout.write('.'.green);
                const currentActuationCounter = actuationCounter;
                const currentDataIndex = component.dataIndex;
                helpers.devices.submitData(component.data[component.dataIndex].value, deviceToken,
                    accountId, deviceId, component.id, function(err, ts) {
                        component.data[component.dataIndex].ts = ts;

                        if (err) {
                            done('Cannot send observation: ' + err);
                        }

                        if (component.data[component.dataIndex].expectedActuation == null) {
                            step(component);
                        } else {
                            const checkActuation = function(currentCounter) {
                                if (currentCounter >= actuationCounter) {
                                    done(new Error('Actuation timeout by component: ' + component.name +
                                    ', data index: ' + currentDataIndex + ', expected actuation value: ' +
                                    component.data[currentDataIndex].expectedActuation.toString()));
                                }
                            };
                            setTimeout(checkActuation, 60 * 1000, currentActuationCounter);
                        }
                    });
            } else {
                done();
            }
        };

        cbManager.set(function(message) {
            const expectedActuationValue = curComponent.data[curComponent.dataIndex].expectedActuation.toString();
            const componentParam = message.content.params.filter(function(param) {
                return param.name === componentParamName;
            });

            if (componentParam.length === 1) {
                const param = componentParam[0];
                const paramValue = param.value.toString();

                if (paramValue === expectedActuationValue) {
                    actuationCounter++;
                    step(curComponent);
                } else {
                    done(new Error('Param value wrong. Expected: ' + expectedActuationValue + ' Received: ' + paramValue));
                }
            } else {
                done(new Error('Did not find component param: ' + componentParamName));
            }
        });

        sendObservationAndCheckRules(components.first);
    }).timeout(60*1000);

    // ---------------------------------------------------------------

    it('Shall check received emails', function(done) {
        before(function() {
            if (checkTestCondition(['non_essential', 'email'])) {
                this.skip();
            }
        });
        const expectedEmailReasons = [];
        components.list.forEach(function(component) {
            component.data.forEach(function(data) {
                if ( data.expectedEmailReason ) {
                    expectedEmailReasons.push(data.expectedEmailReason);
                }
            });
        });

        if (expectedEmailReasons.length === 0) {
            done();
        }

        helpers.mail.waitForNewEmail(nr_mails + expectedEmailReasons.length, null, done);
        const messages = helpers.mail.getAllEmailMessages(emailRecipient);
        messages.forEach((message) => {
            const reason = message.split('Reason: ')[1].split('\n')[0];
            const index = expectedEmailReasons.indexOf(reason);
            if (index > -1) {
                expectedEmailReasons.splice(index, 1);
            }
        });
        assert.equal(expectedEmailReasons.length, 0, 'Received emails do not match expected emails sent from rule-engine');
        done();
    }).timeout(5000);

    it('Wait for backend synchronization', function(done) {
        setTimeout(done, BACKEND_DELAY);
    }).timeout(BACKEND_TIMEOUT);

    it('Shall check observations', function(done) {
        var checkObservations = function(component) {
            if ( component ) {
                if ( component.data.length > 0 ) {
                    helpers.data.searchData(component.data[0].ts, component.data[component.data.length-1].ts,
                        userToken, accountId, deviceId, component.id, false, {}, function(err, result) {
                            if (err) {
                                done(new Error('Cannot get data: ' + err));
                            } else if (result && result.series && result.series.length === 1) {
                                err = component.checkData(result.series[0].points);
                            } else {
                                done(new Error('Cannot get data.'));
                            }

                            if (err) {
                                done(new Error(err));
                            } else {
                                checkObservations(component.next);
                            }
                        });
                } else {
                    checkObservations(component.next);
                }
            } else {
                done();
            }
        };
        checkObservations(components.first);
    }).timeout(BACKEND_TIMEOUT);
});

describe('Do basic rule and alerts subtests ...'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'rules'])) {
            this.skip();
        }
    });
    let test;
    const descriptions = require('./subtests/rules-and-alerts-tests').descriptions;
    it(descriptions.createBasicRules, function(done) {
        test = require('./subtests/rules-and-alerts-tests').test(userToken, userToken2, accountId,
            deviceId, deviceToken, cbManager, new CbManager(), new CbManager(), new CbManager(), new CbManager());
        test.createBasicRules(done);
    }).timeout(GENERIC_TIMEOUT);
    it(descriptions.sendObservations, function(done) {
        test.sendObservations(done);
    }).timeout(120000);
    it(descriptions.deleteRuleAndSendDataAgain, function(done) {
        test.deleteRuleAndSendDataAgain(done);
    }).timeout(120000);
    it(descriptions.createRulesAndCheckAlarmReset, function(done) {
        test.createRulesAndCheckAlarmReset(done);
    }).timeout(120000);
    it(descriptions.createMultipleDevicesAndComponents, function(done) {
        test.createMultipleDevicesAndComponents(done);
    }).timeout(20000);
    it('Wait for backend synchronization', function(done) {
        setTimeout(done, BACKEND_DELAY);
    }).timeout(BACKEND_TIMEOUT);
    it(descriptions.sendObservationsWithMultipleDevices, function(done) {
        test.sendObservationsWithMultipleDevices(done);
    }).timeout(120000);
    it(descriptions.cleanup, function(done) {
        test.cleanup(done);
    }).timeout(GENERIC_TIMEOUT);
});

describe('Do time based rule subtests ...'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'rules'])) {
            this.skip();
        }
    });
	     let test;
	     const descriptions = require('./subtests/timebased-rule-tests').descriptions;
	     it(descriptions.createTbRules, function(done) {
		 test = require('./subtests/timebased-rule-tests').test(userToken, accountId, deviceId, deviceToken, cbManager);
		 test.createTbRules(done);
    }).timeout(10000);
	     it(descriptions.sendObservations, function(done) {
		 test.sendObservations(done);
    }).timeout(120000);
	     it(descriptions.cleanup, function(done) {
		 test.cleanup(done);
	     }).timeout(10000);
});


describe('Do statistics rule subtests ...'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'rules'])) {
            this.skip();
        }
    });
	     let test;
	     const descriptions = require('./subtests/statistic-rule-tests').descriptions;
	     it(descriptions.createStatisticsRules, function(done) {
		 test = require('./subtests/statistic-rule-tests').test(userToken, accountId, deviceId, deviceToken, cbManager);
		 test.createStatisticsRules(done);
    }).timeout(10000);
	     it(descriptions.sendObservations, function(done) {
		 test.sendObservations(done);
    }).timeout(50000);
	     it(descriptions.cleanup, function(done) {
		 test.cleanup(done);
	     }).timeout(10000);
});

describe('Do data sending subtests ...'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'data_sending'])) {
            this.skip();
        }
    });
    let test;
    const descriptions = require('./subtests/data-sending-tests').descriptions;
    it(descriptions.sendAggregatedDataPoints, function(done) {
        test = require('./subtests/data-sending-tests').test(userToken, accountId, deviceId, deviceToken, cbManager);
        test.sendAggregatedDataPoints(done);
    }).timeout(10000);
    it(descriptions.waitForBackendSynchronization, function(done) {
        test.waitForBackendSynchronization(BACKEND_DELAY, done);
    }).timeout(BACKEND_TIMEOUT);
    it(descriptions.receiveAggregatedDataPoints, function(done) {
        test.receiveAggregatedDataPoints(done);
    }).timeout(10000);
    it(descriptions.sendAggregatedMultipleDataPoints, function(done) {
        test.sendAggregatedMultipleDataPoints(done);
    }).timeout(10000);
    it(descriptions.waitForBackendSynchronization, function(done) {
        test.waitForBackendSynchronization(BACKEND_DELAY, done);
    }).timeout(BACKEND_TIMEOUT);
    it(descriptions.receiveAggregatedMultipleDataPoints, function(done) {
        test.receiveAggregatedMultipleDataPoints(done);
    }).timeout(10000);
    it(descriptions.sendDataPointsWithLoc, function(done) {
        test.sendDataPointsWithLoc(done);
    }).timeout(10000);
    it(descriptions.waitForBackendSynchronization, function(done) {
        test.waitForBackendSynchronization(BACKEND_DELAY, done);
    }).timeout(BACKEND_TIMEOUT);
    it(descriptions.receiveDataPointsWithLoc, function(done) {
        test.receiveDataPointsWithLoc(done);
    }).timeout(10000);
    it(descriptions.sendDataPointsWithAttributes, function(done) {
        test.sendDataPointsWithAttributes(done);
    }).timeout(10000);
    it(descriptions.waitForBackendSynchronization, function(done) {
        test.waitForBackendSynchronization(BACKEND_DELAY, done);
    }).timeout(BACKEND_TIMEOUT);
    it(descriptions.receiveDataPointsWithAttributes, function(done) {
        test.receiveDataPointsWithAttributes(done);
    }).timeout(10000);
    it(descriptions.receiveDataPointsWithSelectedAttributes, function(done) {
        test.receiveDataPointsWithSelectedAttributes(done);
    }).timeout(10000);
    it(descriptions.receiveDataPointsCount, function(done) {
        test.receiveDataPointsCount(done);
    }).timeout(10000);
    it(descriptions.receiveAggregations, function(done) {
        test.receiveAggregations(done);
    }).timeout(10000);
    it(descriptions.receiveSubset, function(done) {
        test.receiveSubset(done);
    }).timeout(10000);
    it(descriptions.sendMaxAmountOfSamples, function(done) {
        test.sendMaxAmountOfSamples(done);
    }).timeout(10000);
    it(descriptions.sendPartiallyWrongData, function(done) {
        test.sendPartiallyWrongData(done);
    }).timeout(BACKEND_TIMEOUT * TIMEOUT_FACTOR);
    it(descriptions.sendDataAsAdmin, function(done) {
        test.sendDataAsAdmin(done);
    }).timeout(10000);
    it(descriptions.sendDataAsAdminWithWrongAccount, function(done) {
        test.sendDataAsAdminWithWrongAccount(done);
    }).timeout(10000);
    it(descriptions.sendDataAsUser, function(done) {
        test.sendDataAsUser(done);
    }).timeout(10000);
    it(descriptions.send8000SamplesForAutoDownsampleTest, function(done) {
        test.send8000SamplesForAutoDownsampleTest(done);
    }).timeout(100000);
    /* it(descriptions.send8000SamplesForMultiAggregationTest,function(done) {
       test.send8000SamplesForMultiAggregationTest(done);
     }).timeout(100000);*/
    it(descriptions.waitForBackendSynchronization, function(done) {
        // Due to low profile of test environment and the fact that Kafka/Backend is processing all the 1000s of samples
        // separately, we need to give the backend more time to settle
        test.waitForBackendSynchronization(BACKEND_DELAY * 2, done);
    }).timeout(BACKEND_TIMEOUT * 2);
    it(descriptions.receiveMaxAmountOfSamples, function(done) {
        test.receiveMaxAmountOfSamples(done);
    }).timeout(10000);
    it(descriptions.receivePartiallySentData, function(done) {
        test.receivePartiallySentData(done);
    }).timeout(10000);
    it(descriptions.sendDataAsDeviceToWrongDeviceId, function(done) {
        test.sendDataAsDeviceToWrongDeviceId(done);
    }).timeout(10000);
    it(descriptions.receiveDataFromAdmin, function(done) {
        test.receiveDataFromAdmin(done);
    }).timeout(10000);
    it(descriptions.receiveRawData, function(done) {
        test.receiveRawData(done);
    }).timeout(10000);
    it(descriptions.receiveMaxItems, function(done) {
        test.receiveMaxItems(done);
    }).timeout(10000);
    it(descriptions.receiveAutoAggregatedAvgData, function(done) {
        test.receiveAutoAggregatedAvgData(done);
    }).timeout(10000);
    it(descriptions.receiveAutoAggregatedMaxData, function(done) {
        test.receiveAutoAggregatedMaxData(done);
    }).timeout(10000);
    it(descriptions.receiveAutoAggregatedMinData, function(done) {
        test.receiveAutoAggregatedMinData(done);
    }).timeout(10000);
    it(descriptions.receiveAutoAggregatedSumData, function(done) {
        test.receiveAutoAggregatedSumData(done);
    }).timeout(10000);
    it(descriptions.receiveAggregatedAvgData, function(done) {
        test.receiveAggregatedAvgData(done);
    }).timeout(10000);
    it(descriptions.receiveAggregatedAvgDataMS, function(done) {
        test.receiveAggregatedAvgDataMS(done);
    }).timeout(10000);
    it(descriptions.receiveAggregatedAvgDataMinutes, function(done) {
        test.receiveAggregatedAvgDataMinutes(done);
    }).timeout(10000);
    it(descriptions.receiveRawDataDesc, function(done) {
        test.receiveRawDataDesc(done);
    }).timeout(10000);
    it(descriptions.receiveRawDataLatest, function(done) {
        test.receiveRawDataLatest(done);
    }).timeout(10000);
    it(descriptions.receiveAggregatedDataFromMultipleComponents, function(done) {
        test.receiveAggregatedDataFromMultipleComponents(done);
    }).timeout(10000);
    it(descriptions.cleanup, function(done) {
        test.cleanup(done);
    }).timeout(10000);
});

describe('Streamer subtests...'.bold, function() {
    let test;
    const descriptions = require('./subtests/streamer-tests').descriptions;
    it(descriptions.prepareStreamerTestSetup, function(done) {
        test = require('./subtests/streamer-tests').test(userToken);
        test.prepareStreamerTestSetup(done);
    }).timeout(10000);
    it(descriptions.testWithComponentSplitter, function(done) {
        test.testWithComponentSplitter(done);
    }).timeout(30000);
    it(descriptions.cleanup, function(done) {
        test.cleanup(done);
    });
});

describe('Grafana subtests...'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'grafana'])) {
            this.skip();
        }
    });
    let test;
    const descriptions = require('./subtests/grafana-tests').descriptions;
    it(descriptions.prepareGrafanaTestSetup, function(done) {
        test = require('./subtests/grafana-tests').test(userToken, userToken2);
        test.prepareGrafanaTestSetup(done);
    }).timeout(20000);
    it(descriptions.checkGrafanaHeartbeat, function(done) {
        test.checkGrafanaHeartbeat(done);
    }).timeout(50000);
    it(descriptions.authenticateGrafanaAsViewer, function(done) {
        test.authenticateGrafanaAsViewer(done);
    }).timeout(10000);
    it(descriptions.getDataSourceId, function(done) {
        test.getDataSourceId(done);
    }).timeout(10000);
    it(descriptions.queryUserAccountsData, function(done) {
        setTimeout(test.queryUserAccountsData, 2000, done);
    }).timeout(10000);
    it(descriptions.tryToGetUnbelongedData, function(done) {
        test.tryToGetUnbelongedData(done);
    }).timeout(10000);
    it(descriptions.getSuggestions, function(done) {
        test.getSuggestions(done);
    }).timeout(10000);
    it(descriptions.tryToGetUnbelongedSuggestions, function(done) {
        test.tryToGetUnbelongedSuggestions(done);
    }).timeout(10000);
    it(descriptions.cleanup, function(done) {
        test.cleanup(done);
    }).timeout(10000);
});

describe('TSDB Proxy subtests...'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'tsdbproxy'])) {
            this.skip();
        }
    });
    let test;
    const descriptions = require('./subtests/tsdb-proxy-tests').descriptions;
    it(descriptions.prepareTestSetup, function(done) {
        test = require('./subtests/tsdb-proxy-tests').test(userToken);
        test.prepareTestSetup(done);
    }).timeout(10000);
    it(descriptions.testSuggestion, function(done) {
        test.testSuggestion(done);
    }).timeout(10000);
    it(descriptions.testQuery, function(done) {
        test.testQuery(done);
    }).timeout(10000);
    it(descriptions.cleanup, function(done) {
        test.cleanup(done);
    }).timeout(10000);
});

describe('Do MQTT data sending subtests ...'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'mqtt'])) {
            this.skip();
        }
    });
    let test;
    const descriptions = require('./subtests/mqtt-data-sending-tests').descriptions;
    it(descriptions.setup, function(done) {
        test = require('./subtests/mqtt-data-sending-tests').test(userToken, accountId, deviceId, deviceToken, cbManager, mqttConnector);
        test.setup(done);
    }).timeout(10000);
    it(descriptions.sendSingleDataPoint, function(done) {
        test.sendSingleDataPoint(done);
    }).timeout(10000);
    it(descriptions.sendMultipleDataPoints, function(done) {
        test.sendMultipleDataPoints(done);
    }).timeout(10000);
    it(descriptions.sendDataPointsWithAttributes, function(done) {
        test.sendDataPointsWithAttributes(done);
    }).timeout(10000);
    it(descriptions.waitForBackendSynchronization, function(done) {
        test.waitForBackendSynchronization(BACKEND_DELAY, done);
    }).timeout(BACKEND_TIMEOUT);
    it(descriptions.receiveSingleDataPoint, function(done) {
        test.receiveSingleDataPoint(done);
    }).timeout(10000);
    it(descriptions.receiveMultipleDataPoints, function(done) {
        test.receiveMultipleDataPoints(done);
    }).timeout(10000);
    it(descriptions.receiveDataPointsWithAttributes, function(done) {
        test.receiveDataPointsWithAttributes(done);
    }).timeout(10000);
    it(descriptions.cleanup, function(done) {
        test.cleanup(done);
    }).timeout(10000);
});

describe('Do scale device subtests ...'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'scale'])) {
            this.skip();
        }
    });
    let test;
    const descriptions = require('./subtests/scale-devices-tests').descriptions;
    it(descriptions.setup, function(done) {
        test = require('./subtests/scale-devices-tests').test(userToken, accountId, deviceId, deviceToken, cbManager, mqttConnector);
        test.setup(done);
    }).timeout(100000);
    it(descriptions.sendDataToAllDevices, function(done) {
        test.sendDataToAllDevices(done);
    }).timeout(100000);
    it(descriptions.sendDataToSingleDevice, function(done) {
        test.sendDataToSingleDevice(done);
    }).timeout(200000);
    it(descriptions.waitForBackendSynchronization, function(done) {
        test.waitForBackendSynchronization(BACKEND_DELAY, done);
    }).timeout(BACKEND_TIMEOUT);
    it(descriptions.countAllData, function(done) {
        test.countAllData(done);
    }).timeout(100000);
    it(descriptions.countPartialData, function(done) {
        test.countPartialData(done);
    }).timeout(100000);
    it(descriptions.countSingleDeviceData, function(done) {
        test.countSingleDeviceData(done);
    }).timeout(100000);
    it(descriptions.cleanup, function(done) {
        test.cleanup(done);
    }).timeout(100000);
});


describe('Geting and manage alerts ... \n'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'alerts'])) {
            this.skip();
        }
    });
    it('Shall get list of alerts', function(done) {
        var getListOfAlerts = function(component) {
            if ( component ) {
                const alertsNumer = component.alertsNumber();
                if ( alertsNumer > 0 ) {
                    helpers.alerts.getListOfAlerts(userToken, accountId, function(err, response) {
                        if (err) {
                            done(new Error('Cannot get list of alerts: ' + err));
                        } else {
                            assert.notEqual(response, null, 'response is null');
                            assert.equal(response.length, alertsNumer, 'get wrong number of alerts');
                            component.alerts = response;
                            getListOfAlerts(component.next);
                        }
                    });
                } else {
                    getListOfAlerts(component.next);
                }
            } else {
                done();
            }
        };
        getListOfAlerts(components.first);
    }).timeout(10000);

    it('Shall add comments to the Alert', function(done) {
        var addCommentsToAlert = function(component) {
            if ( component ) {
                if ( component.alerts.length > 0 ) {
                    const comments = {
                        'user': 'alertcomment@intel.com',
                        'timestamp': 123233231221,
                        'text': 'comment',
                    };

                    helpers.alerts.addCommentsToAlert(userToken, accountId, component.alerts[0].alertId, comments, function(err, response) {
                        if (err) {
                            done(new Error('Cannot add comments to the Alert' + err));
                        } else {
                            assert.notEqual(response, null, 'response is null');
                            assert.equal(response.status, 'OK');
                            done();
                        }
                    });
                } else {
                    addCommentsToAlert(component.next);
                }
            } else {
                done();
            }
        };
        addCommentsToAlert(components.first);
    });

    it('Shall get alert infomation', function(done) {
        var getAlertDetails = function(component) {
            if ( component ) {
                if ( component.alerts.length > 0 ) {
                    helpers.alerts.getAlertDetails(userToken, accountId, component.alerts[0].alertId, function(err, response) {
                        if (err) {
                            done(new Error('Cannot get list of alerts: ' + err));
                        } else {
                            assert.notEqual(response, null, 'response is null');
                            if (!component.checkAlert(parseInt(response.conditions[0].components[0].valuePoints[0].value),
                                response.conditions[0].condition) ) {
                                done(new Error('get error alert for: ' + response.conditions[0].condition));
                            }
                            done();
                        }
                    });
                } else {
                    getAlertDetails(component.next);
                }
            } else {
                done();
            }
        };
        getAlertDetails(components.first);
    });

    it('Shall update alert status', function(done) {
        var updateAlertStatus = function(component) {
            if ( component ) {
                if ( component.alerts.length > 1 ) {
                    helpers.alerts.updateAlertStatus(userToken, accountId, component.alerts[1].alertId, 'Open', function(err, response) {
                        if (err) {
                            done(new Error('Cannot update alert status ' + err));
                        } else {
                            assert.notEqual(response, null, 'response is null');
                            assert.equal(response.status, 'Open', 'wrong alert status');
                            done();
                        }
                    });
                } else {
                    updateAlertStatus(component.next);
                }
            } else {
                updateAlertStatus(component.next);
            }
        };
        updateAlertStatus(components.first);
    });

    it('Shall clear alert infomation', function(done) {
        var closeAlert = function(component) {
            if ( component ) {
                if ( component.alerts.length > 2 ) {
                    helpers.alerts.closeAlert(userToken, accountId, component.alerts[2].alertId, function(err) {
                        if (err) {
                            done(new Error('Cannot clear alert infomation ' + err));
                        } else {
                            done();
                        }
                    });
                } else {
                    closeAlert(component.next);
                }
            } else {
                closeAlert(component.next);
            }
        };
        closeAlert(components.first);
    });
});

describe('update rules and create draft rules ... \n'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'rules'])) {
            this.skip();
        }
    });
    let cloneruleId;

    it('Shall clone a rule', function(done) {
        var cloneRule = function(component) {
            if ( component ) {
                if ( component.rules.length > 0 ) {
                    const rulename_clone = component.rules[0].name + ' - cloned';

                    helpers.rules.cloneRule(userToken, accountId, component.rules[0].id, function(err, response) {
                        if (err) {
                            done(new Error('cannot clone a rule ' + err));
                        } else {
                            assert.notEqual(response, null, 'response is null');
                            assert.equal(response.name, rulename_clone, 'clone error rule');
                            cloneruleId = response.id;
                            done();
                        }
                    });
                } else {
                    cloneRule(component.next);
                }
            } else {
                done();
            }
        };
        cloneRule(components.first);
    });

    it('Shall update a rule', function(done) {
        var updateRule = function(component) {
            if ( component ) {
                if ( component.rules.length > 0 ) {
                    const newrule = new Rule('oisp-tests-rule-high-temp-new', '>', 28);
                    newrule.synchronizationStatus = 'NotSync';
                    newrule.actuationCmd = switchOffCmdName;
                    newrule.cid = component.id;
                    newrule.conditionComponent = component.name;

                    helpers.rules.updateRule(newrule, userToken, accountId, cloneruleId, function(err, response) {
                        if (err) {
                            done(new Error('Cannot update rules ' + err));
                        } else {
                            assert.equal(response.name, newrule.name, 'update rule wrong');
                            done();
                        }
                    });
                } else {
                    updateRule(component.next);
                }
            } else {
                done();
            }
        };
        updateRule(components.first);
    }).timeout(20000);

    it('Shall update rule status', function(done) {
        var updateRuleStatus = function(component) {
            if ( component ) {
                if ( component.rules.length > 1 ) {
                    helpers.rules.updateRuleStatus(userToken, accountId, component.rules[1].id, 'Archived', function(err, response) {
                        if (err) {
                            done(new Error('Cannot update rule status ' + err));
                        } else {
                            assert.notEqual(response, null, 'response is null');
                            assert.equal(response.status, 'Archived', 'wrong rule status');
                            done();
                        }
                    });
                } else {
                    updateRuleStatus(component.next);
                }
            } else {
                done();
            }
        };
        updateRuleStatus(components.first);
    });

    it('Shall create a draft rule', function(done) {
        helpers.rules.createDraftRule('Draftrule', userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('cannot create a draft rule ' + err));
            } else {
                assert.notEqual(response, null, 'response is null');
                assert.equal(response.name, 'Draftrule', 'wrong draft rule name');
                done();
            }
        });
    });
});

describe('Adding user and posting email ...\n'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'email'])) {
            this.skip();
        }
    });

    it('Shall add a new user and post email', function(done) {
        assert.isNotEmpty(imap_username, 'no email provided');
        nr_mails = helpers.mail.getAllEmailMessages().length;
        assert.isNotEmpty(imap_password, 'no password provided');
        helpers.users.addUser(userToken, imap_username, imap_password, function(err, response) {
            if (err) {
                done(new Error('Cannot create new user: ' + err));
            } else {
                assert.equal(response.email, imap_username, 'add wrong user');
                done();
            }
        });
    });

    it('Shall activate user with token', function(done) {
        helpers.mail.waitForNewEmail(nr_mails+1, null, done, 60 * 1000);
        const message = helpers.mail.getAllEmailMessages(imap_username)[0];
        const regexp = /token=\w*/;
        const activationToken = message.match(regexp).toString().split('=')[1];
        helpers.users.activateUser(activationToken, function(err, response) {
            if (err) {
                done(new Error('Cannot activate user (token ' + activationToken + ') : ' + err));
            } else {
                assert.equal(response.status, 'OK', 'cannot activate user');
                helpers.auth.login(imap_username, imap_password, function(err, grant) {
                    if (err) {
                        done(new Error('Cannot authenticate receiver: ' + err));
                    } else {
                        receiverToken = grant.token;
                        done();
                    }
                });
            }
        });
    }).timeout(60 * 1000);

    it('Shall create receiver account', function(done) {
        assert.notEqual(receiverToken, null, 'Invalid user token');
        helpers.accounts.createAccount('receiver', receiverToken, function(err, response) {
            if (err) {
                done(new Error('Cannot create account: ' + err));
            } else {
                assert.equal(response.name, 'receiver', 'accounts name is wrong');
                receiveraccountId = response.id;
                helpers.auth.login(imap_username, imap_password, function(err, grant) {
                    if (err) {
                        done(new Error('Cannot authenticate receiver: ' + err));
                    } else {
                        receiverToken = grant.token;
                        done();
                    }
                });
            }
        });
    });
});

describe('Invite receiver ...\n'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'email'])) {
            this.skip();
        }
    });
    let inviteId = null;

    it('Shall create invitation', function(done) {
        // a mail will be sent to receiver
        nr_mails = helpers.mail.getAllEmailMessages(imap_username).length;
        helpers.invitation.createInvitation(userToken, accountId, imap_username, function(err, response) {
            if (err) {
                done(new Error('Cannot create invitation: ' + err));
            } else {
                assert.equal(response.email, imap_username, 'send invite to wrong name');
                done();
            }
        });
    }).timeout( 30 * 1000);


    it('Shall get all invitations', function(done) {
        helpers.invitation.getAllInvitations(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('Cannot get invitation: ' + err));
            } else {
                assert.equal(response[0], imap_username, 'send invite to wrong name');
                done();
            }
        });
    });

    it('Shall delete invitation and send again', function(done) {
        helpers.invitation.deleteInvitations(userToken, accountId, imap_username, function(err) {
            if (err) {
                done(new Error('Cannot delete invitation: ' + err));
            } else {
                nr_mails = helpers.mail.getAllEmailMessages().length;
                helpers.invitation.createInvitation(userToken, accountId, imap_username, function(err, response) {
                    // when send invitation, the receiver will receive an email said he should login to accept the invitation
                    if (err) {
                        done(new Error('Cannot create invitation: ' + err));
                    } else {
                        assert.equal(response.email, imap_username, 'send invite to wrong name');
                        helpers.mail.waitForNewEmail(nr_mails + 1, null, done, 30 * 1000);
                        done();
                    }
                });
            }
        });
    }).timeout(30 * 1000);

    it('Shall get specific invitations', function(done) {
        var getInvitation = function(cb) {
            helpers.auth.login(imap_username, imap_password, function(err, grant) {
                if (err) {
                    done(new Error('Cannot authenticate: ' + err));
                } else {
                    receiverToken = grant.token;
                    helpers.invitation.getInvitations(receiverToken, receiveraccountId, imap_username, function(err, response) {
                        if (err) {
                            cb(err, null);
                        } else {
                            if (response != null) {
                                cb(null, response);
                            } else {
                                process.stdout.write('.');
                                setTimeout(function() {
                                    getInvitation(cb);
                                }, 500);
                            }
                        }
                    });
                }
            });
        };
        getInvitation(function(err, response) {
            assert.equal(err, null, 'get invitation error');
            inviteId = response[0]._id;
            done();
        });
    }).timeout(2 * 60 * 1000);

    it('Shall accept specific invitations', function(done) {
        helpers.invitation.acceptInvitation(receiverToken, accountId, inviteId, function(err, response) {
            if (err) {
                done(new Error('cannot accept invitetion :' + err));
            } else {
                assert.equal(response.accountName, accountName, 'accept wrong invitation');
                done();
            }
        });
    });

    it('Shall not accept non-existing invitations, or crash', function(done) {
    	inviteId = 0;
        helpers.invitation.acceptInvitation(receiverToken, accountId, inviteId, function(err, response) {
            if (err) {
                done();
            } else {
                done(new Error('non-existing invitation accepted' + response));
            }
        });
    });

    it('Shall request activation', function(done) {
        const username = process.env.USERNAME;
        nr_mails = helpers.mail.getAllEmailMessages().length;
        helpers.users.requestUserActivation(username, function(err, response) {
            if (err) {
                done(new Error('cannot request activation:' + err));
            } else {
                assert.equal(response.status, 'OK');
                helpers.mail.waitForNewEmail(nr_mails +1, null, done, 30 * 1000);
                done();
            }
        });
    }).timeout( 30 * 1000);

    it('Shall get id of receiver and change privilege', function(done) {
        helpers.auth.tokenInfo(receiverToken, function(err, response) {
            if (err) {
                done(new Error('Cannot get token info: ' + err));
            } else {
                receiveruserId = response.payload.sub;
                helpers.accounts.changeAccountUser(accountId, userToken, receiveruserId, function(err, response) {
                    if (err) {
                        done(new Error('Cannot change another user privilege to your account: ' + err));
                    } else {
                	assert.equal(response.status, 'OK');
                        done();
                    }
                });
            }
        });
    });

    it('Shall list all users for account', function(done) {
        helpers.accounts.getAccountUsers(accountId, userToken, function(err, response) {
            if (err) {
                done(new Error('Cannot list users for account: ' + err));
            } else {
                assert.equal(response.length, 2, 'error account numbers');
                done();
            }
        });
    });
});

describe('change password and delete receiver ... \n'.bold, function() {
    before(function() {
        if (checkTestCondition(['non_essential', 'email'])) {
            this.skip();
        }
    });
    it('Shall request change receiver password', function(done) {
        const username = process.env.USERNAME;
        nr_mails = helpers.mail.getAllEmailMessages().length;
        helpers.users.requestUserPasswordChange(username, function(err, response) {
            if (err) {
                done(new Error('Cannot request change password : ' + err));
            } else {
                assert.equal(response.status, 'OK', 'status error');
                done();
            }
        });
    });

    it('Shall update receiver password', function(done) {
        const username = process.env.USERNAME;
        helpers.mail.waitForNewEmail(nr_mails+1, null, done, 2 * 60 * 1000);
        const message = helpers.mail.getAllEmailMessages(username)[0];
        const regexp = /token=\w*/;
        const activationToken = message.match(regexp).toString().split('=')[1];

        if ( activationToken === null) {
            done(new Error('Wrong email ' + message ));
        } else {
            assert.isString(activationToken, 'activationToken is not string');
            const password = 'Receiver12345';
            helpers.users.updateUserPassword(activationToken, password, function(err, response) {
                if (err) {
                    done(new Error('Cannot update receiver password : ' + err));
                } else {
		    assert.equal(response.status, 'OK', 'status error');
                    done();
                }
            });
        }
    }).timeout(2 * 60 * 1000);

    it('Shall change password', function(done) {
        const username = process.env.USERNAME;
	    const oldPasswd = 'Receiver12345';
        const newPasswd = 'oispnewpasswd2';

        helpers.users.changeUserPassword(userToken, username, oldPasswd, newPasswd, function(err, response) {
            if (err) {
                done(new Error('Cannot change password: ' + err));
            } else {
                assert.equal(response.password, 'oispnewpasswd2', 'new password error');
                done();
            }
        });
    });

    it('Shall delete draft rule', function(done) {
        helpers.rules.deleteRule(userToken, accountId, null, function(err, response) {
            if (err) {
                done(new Error('cannot delete a draft rule ' + err));
            } else {
                assert.notEqual(response, null, 'response is null');
                assert.equal(response.status, 'Done');
                done();
            }
        });
    });

    it('Shall delete a rule', function(done) {
        helpers.rules.deleteRule(userToken, accountId, rulelist[0].id, function(err, response) {
            if (err) {
                done(new Error('cannot delete a rule ' + err));
            } else {
                assert.notEqual(response, null, 'response is null');
                assert.equal(response.status, 'Done');
                done();
            }
        });
    });

    it('Shall delete a component', function(done) {
        var deleteComponent = function(component) {
            if ( component ) {
                helpers.devices.deleteDeviceComponent(userToken, accountId, deviceId, component.id, function(err, response) {
                    if (err) {
                        done(new Error('cannot delete a component ' + err));
                    } else {
                        assert.notEqual(response, null, 'response is null');
                        assert.equal(response.status, 'Done');
                        deleteComponent(component.next);
                    }
                });
            } else {
                done();
            }
        };
        deleteComponent(components.first);
    });

    it('Shall delete a device', function(done) {
        helpers.devices.deleteDevice(userToken, accountId, deviceId, function(err, response) {
            if (err) {
                done(new Error('cannot delete a device ' + err));
            } else {
                assert.notEqual(response, null, 'response is null');
                assert.equal(response.status, 'Done');
                done();
            }
        });
    });

    it('Shall delete an account', function(done) {
        helpers.accounts.deleteAccount(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error('cannot delete an account ' + err));
            } else {
                assert.notEqual(response, null, 'response is null');
                assert.equal(response.status, 'Done');
                done();
            }
        });
    });

    it('Shall delete a user', function(done) {
        helpers.users.deleteUser(userToken, userId, function(err, response) {
            if (err) {
                done(new Error('cannot delete a user ' + err));
            } else {
                assert.notEqual(response, null, 'response is null');
                assert.equal(response.status, 'Done');
                helpers.users.deleteUser(userToken2, userId2, function(err) {
                    if (err) {
                        return done(err);
                    }
                    helpers.users.deleteUser(receiverToken, receiveruserId, function(err) {
                        if (err) {
                            return done(err);
                        }
                        done();
                    });
                });
            }
        });
    });
});
