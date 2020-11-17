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
"use strict";

var chai = require('chai');
var assert = chai.assert;
var colors = require('colors'); // jshint ignore:line

var config = require("./test-config.json");
var kafka = require('kafka-node');
var helpers = require("./lib/helpers");
var promtests = require('./subtests/promise-wrap');

var userToken;
var deviceToken;
var accountId = process.env.ACCOUNTID;
var deviceId;
var deviceName = "backup-tests-device";
var activationCode = process.env.ACTIVATIONCODE;
var userId;
var username = process.env.USERNAME;
var password = process.env.PASSWORD;

var componentId;
var componentType = "temperature.v1.0";
var componentName = "temp;";

var getNewUserTokens = function(done) {

    return promtests.authGetToken(username, password).then(grant => {
        userToken = grant.token;
        done();
    }).catch(err => {
        done(err);
    });
};
//-------------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------------
process.stdout.write("_____________________________________________________________________\n".bold);
process.stdout.write("                                                                     \n");
process.stdout.write("                           OISP Backup Test after                    \n".green.bold);
process.stdout.write("_____________________________________________________________________\n".bold);



describe("Waiting for OISP services to be ready ...\n".bold, function() {

    before(function(done) {
        userToken = null;
        deviceId = "00-12-23-34-45-56";
        done();
    });

    it('Shall wait for oisp services to start', function(done) {
        var kafkaConsumer;
        var topic = config["connector"]["kafka"]["topic"];
        var partition = 0;
        var kafkaAddress = config["connector"]["kafka"]["host"] + ":" + config["connector"]["kafka"]["port"];
        var kafkaClient = new kafka.KafkaClient({ kafkaHost: kafkaAddress });
        var kafkaOffset = new kafka.Offset(kafkaClient);

        var getKafkaOffset = function(topic_, partition_, cb) {
            kafkaOffset.fetchLatestOffsets([topic_], function(error, offsets) {
                if (!error) {
                    cb(offsets[topic_][partition_]);
                }
                else {
                    setTimeout(function() {
                        getKafkaOffset(topic_, partition_, cb);
                    }, 1000);
                }
            });
        };

        getKafkaOffset(topic, partition, function(offset) {
            if (offset >= 0) {
                var topics = [{ topic: topic, offset: offset + 1, partition: partition }];
                var options = { autoCommit: true, fromOffset: true };

                kafkaConsumer = new kafka.Consumer(kafkaClient, topics, options);

                var oispServicesToMonitor = ['rules-engine'];
                process.stdout.write("    ");
                kafkaConsumer.on('message', function(message) {
                    process.stdout.write(".".green);
                    if (kafkaConsumer) {
                        var i = 0;
                        for (i = 0; i < oispServicesToMonitor.length; i++) {
                            if (oispServicesToMonitor[i] != null && oispServicesToMonitor[i].trim() === message.value.trim()) {
                                oispServicesToMonitor[i] = null;
                            }
                        }
                        for (i = 0; i < oispServicesToMonitor.length; i++) {
                            if (oispServicesToMonitor[i] != null) {
                                break;
                            }
                        }
                        if (i === oispServicesToMonitor.length) {
                            kafkaConsumer.close(true);
                            kafkaConsumer = null;
                            process.stdout.write("\n");
                            done();
                        }
                    }
                });
            }
            else {
                done(new Error("Cannot get Kafka offset "));
            }
        });

    }).timeout(1000 * 60 * 1000);
});

describe("get authorization and manage user ...\n".bold, function() {

    it('Shall authenticate', function(done) {
        getNewUserTokens(done);
    }).timeout(10000);

    it('Shall get token info', function (done) {
        helpers.auth.tokenInfo(userToken, function (err, response) {
            if (err) {
                done(new Error("Cannot get token info: " + err));
            } else {
                assert.equal(response.header.typ, 'JWT', 'response type error' );
                if (response.payload.sub == null){
                    done(new Error("get null user id"));
                }
                else {
                    userId = response.payload.sub;
                }

                done();
            }
        });
    });

    it('Shall get user information', function(done) {
        helpers.users.getUserInfo(userToken, userId, function(err, response) {
            if (err) {
                done(new Error("Cannot get user information : " + err));
            } else {
                assert.isString(response.id);
                done();
            }
        });
    });

});

describe("Check account and device ...\n".bold, function() {
    it('Shall retrieve account info', function(done) {
        helpers.accounts.getAccountInfo(accountId, userToken, function(err, response) {
            if (err) {
                done(new Error("Cannot get user info: " + err));
            } else {
                assert.equal(accountId, response.id);
                done();
            }
        });
    }).timeout(10000);


    it('Shall get devices', function(done) {

        helpers.devices.getDevices(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot create device: " + err));
            } else {
                assert.equal(response.length, 1);
                assert.equal(response[0].deviceId, deviceId, 'incorrect device id');
                assert.equal(response[0].name, deviceName, 'incorrect device name');
                assert.equal(response[0].components[0].name, componentName);
                assert.equal(response[0].components[0].type, componentType);
                componentId = response[0].components[0].cid;
                done();
            }
        });
    });

    it('Shall activate device without token', function(done) {
        assert.notEqual(deviceId, null, "Invalid device id");

        helpers.devices.activateDeviceWithoutToken(activationCode, deviceId, function(err, response) {
            if (err) {
                done(new Error("Cannot activate device: " + err));
            } else {
                deviceToken = response.deviceToken;
                done();
            }
        });
    }).timeout(5000);

    it('Shall send data point', function(done) {

        helpers.devices.submitData("23", deviceToken, accountId, deviceId, componentId, function(err) {
            if (err) {
                done(new Error("Cannot create device: " + err));
            } else {
                done();
            }
        });
    }).timeout(10000);
});
