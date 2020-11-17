/**
 * Copyright (c) 2017-2019 Intel Corporation
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
//----------------------------------p---------------------------------------------------------------------

// This module reads mails from a local fake-smtp-server
// See https://www.npmjs.com/package/fake-smtp-server

var request = require("sync-request");

const MAIL_URL="http://localhost:1080/api/emails";


function waitForNewEmail(num, to, done, timeout = 5000) {
    var mails = [];
    var startTime = new Date().getTime();
    var mailFilter = function(mail) {
        return mail.to.value.address === to;
    };
    while (mails.length < num) {
        var currTime = new Date().getTime();
        if (currTime - startTime >= timeout) {
            return done(new Error("Timeout waiting for emails at email index: " + mails.length), + ", expected " + num + " emails");
        }
        mails = JSON.parse(request("GET", MAIL_URL).getBody("utf-8"), { socketTimeout: timeout, timeout: timeout });
        if (to != null) {
            mails = mails.filter(mailFilter);
        }
    }
}

function getAllEmailMessages(to=null, timeout = 60 * 1000) {
    var mails = JSON.parse(request("GET", MAIL_URL).getBody("utf-8"), { socketTimeout: timeout, timeout: timeout });
    if (to != null) {
        mails = mails.filter(mail => mail.to.text === to);
    }
    return mails.map(mail => mail.text.replace("&lt;", "<").replace("&gt;", ">"));
}

module.exports ={
    getAllEmailMessages: getAllEmailMessages,
    waitForNewEmail: waitForNewEmail
};
