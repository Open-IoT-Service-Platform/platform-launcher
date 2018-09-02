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


function removeRecentEmail(user, password, host, port){
    var imap = new Imap({
        user: user,
        password: password,
        host: host,
        port: port,
	connTimeout: 30000,
	authTimeout: 20000,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });

    return new Promise(function(resolve,reject){
	imap.once('ready', function() {
            imap.openBox('INBOX', false, function(err, box) {
		if (!err){
		    imap.seq.setFlags(1, '\\Deleted', function(err){
			if (err) reject(err);
			imap.closeBox(true, function(err){
			    if (err) reject(err);
				resolve();
			})
		    })
		}
		else
		    reject(err);
	    })
	});
	imap.connect();
    });
}

function waitAndConsumeEmailMessage(user, password, host, port){
    return waitForNewEmail(user, password, host,port, 1)
	.then(() => removeRecentEmail(user, password, host, port));
}

function waitForNewEmail(user, password, host, port, num){
    var newmail = 0;
    var timeoutcount = 0;
    const TIMEOUTS = 20;

    var imap = new Imap({
        user: user,
        password: password,
        host: host,
        port: port,
	connTimeout: 30000,
	authTimeout: 20000,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });

    return new Promise(function(resolve,reject){
	imap.once('ready', function(){
	    check();
	    function check(){
		imap.status('INBOX', function(err, box) {
		    if (box.messages.unseen >= num) {
			resolve(box.messages.unseen);
		    }
		    else if (box.messages.unseen < num && timeoutcount < TIMEOUTS){
			setTimeout(check, 1000);
			timeoutcount++;
		    }
		    else if (timeoutcount == TIMEOUTS) {
			reject(new Error("Timeout"))
		    }
		});
	    };
	})
	imap.connect();
    })
}

function getEmailMessage(user, password, host, port, num) {

    var imap = new Imap({
        user: user,
        password: password,
        host: host,
        port: port,
	connTimeout: 30000,
	authTimeout: 20000,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });

    return new Promise(function(resolve, reject){
	imap.once('ready', function() {
            imap.openBox('INBOX', false, function(err, box) {
		if ( !err ) {
                    if ( num <= 0 ) {
			num = box.messages.total;
                    }
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
			    imap.seq.addFlags(num, '\\Deleted', () =>
					      imap.closeBox(true, () => {
						  imap.destroy();
						  imap.end();
					      })
					     );
			    resolve(buffer);
			});
                    });
		}
		else {
                    reject(err);
		}
            });
	});

	imap.once('error', function(err) {
            reject(err);
	});

	imap.connect();
    })
}


function getAllEmailMessages(user, password, host, port) {

    var imap = new Imap({
        user: user,
        password: password,
        host: host,
        port: port,
	connTimeout: 30000,
	authTimeout: 20000,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });

    return new Promise(function(resolve, reject){
	imap.once('ready', function() {
            imap.openBox('INBOX', false, function(err, box) {
		if ( !err ) {
		    var num = Array.from(new Array(box.messages.total), (elem, index) => index + 1);
                    var f = imap.seq.fetch(num, {
                        bodies: ['HEADER.FIELDS (TO)', '1'],
                        struct: true
                    });
		    var buffers = [];
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
			    buffers.push(buffer);
			    imap.seq.addFlags(seqno, '\\Deleted', (err) => {
				if (err){
				    reject(err);
				}
			    });
			    //resolve(buffers);
			});
                    });
		    f.once('error', (err) => {
			reject(err);
		    })
		    f.once('end', () => {
			imap.closeBox(true, () => {
			    imap.destroy();
			    imap.end();
			})
			resolve(buffers);
		    })
		}
		else {
		    reject(err);
		}
            });
	});

	imap.once('error', function(err) {
            reject(err);
	});
	imap.connect();
    });
}

module.exports ={
    getEmailMessage: getEmailMessage,
    getAllEmailMessages: getAllEmailMessages,
    waitForNewEmail: waitForNewEmail,
    waitAndConsumeEmailMessage: waitAndConsumeEmailMessage
}
