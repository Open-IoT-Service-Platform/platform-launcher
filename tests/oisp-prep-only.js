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

var chai = require('chai');
var assert = chai.assert;
var fs = require('fs');

var config = require("./test-config.json");
var kafka = require('kafka-node');
var helpers = require("./lib/helpers");
var colors = require('colors');


var accountName = "oisp-tests";

var userToken;
var accountId;
var deviceId;

//-------------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------------
process.stdout.write("_____________________________________________________________________\n".bold);
process.stdout.write("                                                                     \n");
process.stdout.write("                           OISP TEST PREP                            \n".green.bold);
process.stdout.write("_____________________________________________________________________\n".bold);



describe("Waiting for OISP services to be ready ...\n".bold, function() {

    before(function(done) {
        userToken = null;
        accountId = null;
        deviceId = "00-11-22-33-44-55";
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
                    cb(offsets[topic_][partition_])
                }
                else {
                    setTimeout(function() {
                        getKafkaOffset(topic_, partition_, cb);
                    }, 1000)
                }
            })
        };

        getKafkaOffset(topic, partition, function(offset) {
            if (offset >= 0) {
                var topics = [{ topic: topic, offset: offset + 1, partition: partition }]
                var options = { autoCommit: true, fromOffset: true };

                kafkaConsumer = new kafka.Consumer(kafkaClient, topics, options)

                var oispServicesToMonitor = ['rules-engine'];
                process.stdout.write("    ");
                kafkaConsumer.on('message', function(message) {
                    process.stdout.write(".".green);
                    if (kafkaConsumer) {
                        var now = new Date().getTime();
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
                        if (i == oispServicesToMonitor.length) {
                            kafkaConsumer.close(true);
                            kafkaConsumer = null;
                            process.stdout.write("\n");
                            done();
                        }
                    }
                });
            }
            else {
                done(new Error("Cannot get Kafka offset "))
            }
        });

    }).timeout(2 * 60 * 1000);
})

describe("get user token and activation code ...\n".bold, function() {

    var activationCode;
    var accountId;
    var userToken;
    var username = process.env.USERNAME;
    var password = process.env.PASSWORD;

    it('Shall get userToken', function(done) {

        assert.isNotEmpty(username, "no username provided");
        assert.isNotEmpty(password, "no password provided");

        helpers.auth.login(username, password, function(err, token) {
            if (err) {
                done(new Error("Cannot authenticate: " + err));
            } else {
                userToken = token;
                done();
            }
        })
    })


    it('Shall create account', function(done) {
        assert.notEqual(userToken, null, "Invalid user token")
        helpers.accounts.createAccount(accountName, userToken, function(err, response) {
            if (err) {
                done(new Error("Cannot create account: " + err));
            } else {
                assert.equal(response.name, accountName, "accounts name is wrong");
                accountId = response.id;
                done();
            }
        })
    })

    it('Shall get account activation code', function(done) {

        helpers.accounts.getAccountActivationCode(accountId, userToken, function(err, response) {
            if (err) {
                done(new Error("Cannot get account activation code: " + err));
            } else {
                activationCode = response.activationCode;
                done();
            }
        })
    })
    it('Shall create prep config', function(done) {

        var prepConf = {
            "username": username,
            "password": password,
            "userToken": userToken,
            "accountId": accountId,
            "activationCode": activationCode
        }
        fs.writeFileSync("oisp-prep-only.conf", JSON.stringify(prepConf))
        done();
    })
})

