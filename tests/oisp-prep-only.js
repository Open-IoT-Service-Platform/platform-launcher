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
var promtests = require('./subtests/promise-wrap');


var accountName = "oisp-tests";

var userToken;
var accountId;
var deviceId;
var activationCode;
var userId;
var username = process.env.USERNAME;
var password = process.env.PASSWORD;

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

    }).timeout(1000 * 60 * 1000);
})

describe("get authorization and manage user ...\n".bold, function() {

    it('Shall authenticate', function(done) {
        var username = process.env.USERNAME;
        var password = process.env.PASSWORD;

        var username2 = process.env.USERNAME2;
        var password2 = process.env.PASSWORD2;

        assert.isNotEmpty(username, "no username provided");
        assert.isNotEmpty(password, "no password provided");
        assert.isNotEmpty(username, "no username2 provided");
        assert.isNotEmpty(password, "no password2 provided");

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
        })
    })

    it('Shall get user information', function(done) {
        helpers.users.getUserInfo(userToken, userId, function(err, response) {
            if (err) {
                done(new Error("Cannot get user information : " + err));
            } else {
                assert.isString(response.id)
                done();
            }
        })
    })

    it('Shall update user information', function(done) {
        var newuserInfo = {
            attributes:{
                "phone":"12366666666",
                "another_attribute":"another_value",
                "new":"next_string_value"
            }
        }

        helpers.users.updateUserInfo(userToken, userId, newuserInfo, function(err, response) {
            if (err) {
                done(new Error("Cannot update user information : " + err));
            } else {
                assert.equal(response.status, 'OK', 'status error')
                done();
            }
        })
    })
})

describe("Creating account and device ...\n".bold, function() {

    var accountInfo;

    it('Shall create account', function(done) {
        assert.notEqual(userToken, null, "Invalid user token")
        helpers.accounts.createAccount(accountName, userToken, function(err, response) {
            if (err) {
                done(new Error("Cannot create account: " + err));
            } else {
                assert.equal(response.name, accountName, "accounts name is wrong");
                accountId = response.id;
                getNewUserTokens(done);
            }
        })
    }).timeout(10000);

    it('Shall get account info', function (done) {
        helpers.accounts.getAccountInfo(accountId, userToken, function (err, response) {
            if (err) {
                done(new Error("Cannot get account info: " + err));
            } else {
                accountInfo = response;
                done();
            }
        })
    })

    it('Shall update an account', function (done) {

        accountInfo.attributes = {
            "phone":"123456789",
            "another_attribute":"another_value",
            "new":"next_string_value"
        }

        helpers.accounts.updateAccount(accountId, userToken, accountInfo, function (err, response) {
            if (err) {
                done(new Error("Cannot update account: " + err));
            } else {
                assert.deepEqual(response.attributes, accountInfo.attributes, 'new attributes not being updated');
                done();
            }
        })
    })

    it('Shall get account activation code', function (done) {

        helpers.accounts.getAccountActivationCode(accountId, userToken, function (err, response) {
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
