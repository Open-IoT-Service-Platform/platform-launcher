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
var colors = require('colors'); // jshint ignore:line
var fs = require('fs');

var helpers = require("./lib/helpers");
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

describe("get authorization and manage user ...\n".bold, function() {
    before(function(done) {
        userToken = null;
        accountId = null;
        deviceId = "00-11-22-33-44-55";
        done();
    });

    it('Shall authenticate', function(done) {
        var username = process.env.USERNAME;
        var password = process.env.PASSWORD;

        assert.isNotEmpty(username, "no username provided");
        assert.isNotEmpty(password, "no password provided");

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

    it('Shall update user information', function(done) {
        var newuserInfo = {
            attributes:{
                "phone":"12366666666",
                "another_attribute":"another_value",
                "new":"next_string_value"
            }
        };

        helpers.users.updateUserInfo(userToken, userId, newuserInfo, function(err, response) {
            if (err) {
                done(new Error("Cannot update user information : " + err));
            } else {
                assert.equal(response.status, 'OK', 'status error');
                done();
            }
        });
    });
});

describe("Creating account and device ...\n".bold, function() {

    var accountInfo;

    it('Shall create account', function(done) {
        assert.notEqual(userToken, null, "Invalid user token");
        helpers.accounts.createAccount(accountName, userToken, function(err, response) {
            if (err) {
                done(new Error("Cannot create account: " + err));
            } else {
                assert.equal(response.name, accountName, "accounts name is wrong");
                accountId = response.id;
                getNewUserTokens(done);
            }
        });
    }).timeout(10000);

    it('Shall get account info', function (done) {
        helpers.accounts.getAccountInfo(accountId, userToken, function (err, response) {
            if (err) {
                done(new Error("Cannot get account info: " + err));
            } else {
                accountInfo = response;
                done();
            }
        });
    });

    it('Shall update an account', function (done) {

        accountInfo.attributes = {
            "phone":"123456789",
            "another_attribute":"another_value",
            "new":"next_string_value"
        };

        helpers.accounts.updateAccount(accountId, userToken, accountInfo, function (err, response) {
            if (err) {
                done(new Error("Cannot update account: " + err));
            } else {
                assert.deepEqual(response.attributes, accountInfo.attributes, 'new attributes not being updated');
                done();
            }
        });
    });

    it('Shall get account activation code', function (done) {

        helpers.accounts.getAccountActivationCode(accountId, userToken, function (err, response) {
            if (err) {
                done(new Error("Cannot get account activation code: " + err));
            } else {
                activationCode = response.activationCode;
                done();
            }
        });
    });

    it('Shall create prep config', function(done) {

        var prepConf = {
            "username": username,
            "password": password,
            "userToken": userToken,
            "accountId": accountId,
            "activationCode": activationCode
        };
        fs.writeFileSync("oisp-prep-only.conf", JSON.stringify(prepConf));
        done();
    });
});
