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

var Imap = require('imap');

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

module.exports ={
    getEmailMessage: getEmailMessage
}