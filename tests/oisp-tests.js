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
var expect = chai.expect;

var config = require("./test-config.json");
var oispSdk = require("@open-iot-service-platform/oisp-sdk-js");
var proxyConnector = oispSdk(config).lib.proxies.getControlConnector('ws');
var kafka = require('kafka-node');
var cfenvReader = require('./lib/cfenv/reader');
var helpers = require("./lib/helpers");
var colors = require('colors');

var exec = require('child_process').exec;

var accountName = "oisp-tests";
var deviceName = "oisp-tests-device";

var componentName = "temperature-sensor";
var componentType = "temperature.v1.0";

var actuatorName = "powerswitch-actuator";
var actuatorType = "powerswitch.v1.0";

var switchOnCmdName = "switch-on";
var switchOffCmdName = "switch-off";


var emailRecipient = "test.receiver@streammyiot.com"

var imap_username = process.env.IMAP_USERNAME;
var imap_password = process.env.IMAP_PASSWORD; 
var imap_host     = process.env.IMAP_HOST;
var imap_port     = process.env.IMAP_PORT;

var recipientEmail = imap_username; 

var rules = [];

rules[switchOnCmdName] = {
    name: "oisp-tests-rule-low-temp",
    conditionComponent: componentName,
    basicConditionOperator: "<=",
    basicConditionValue: "15",
    actions: [
                {
                    type: "actuation",
                    target: [ switchOnCmdName ]
                },
                {
                    type: "mail",
                    target: [ emailRecipient ]
                }
            ],
};

rules[switchOffCmdName] = {
    name: "oisp-tests-rule-high-temp",
    conditionComponent: componentName,
    basicConditionOperator: ">",
    basicConditionValue: "25",
    actions: [
                {
                    type: "actuation",
                    target: [ switchOffCmdName ]
                },
                {
                    type: "mail",
                    target: [ emailRecipient ]
                }
            ],
};

//-------------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------------
var userToken;
var receiverToken;
var receiveruserId;
var receiveraccountId;
var userId; 
var accountId;
var deviceId;
var deviceToken;
var componentId;
var actuatorId;
var rulelist;
var alertlist;               
var componentParamName; 
var firstObservationTime;

var temperatureValues = [{
        value: -15,
        expectedActuation: 1, // swich on
        expectedEmailReason: "temperature-sensor <= 15"
    },
    {
        value: -5,
        expectedActuation: 1, // swich on
        expectedEmailReason: "temperature-sensor <= 15"
    },
    {
        value: 5,
        expectedActuation: 1, // swich on
        expectedEmailReason: "temperature-sensor <= 15"
    },
    {
        value: 15,
        expectedActuation: 1, // swich on
        expectedEmailReason: "temperature-sensor <= 15"
    },
    {
        value: 25,
        expectedActuation: null, // do nothing (no actuation)
        expectedEmailReason: null,
    },
    {
        value: 30,
        expectedActuation: 0, // swich off
        expectedEmailReason: "temperature-sensor > 25"
    },
    {
        value: 20,
        expectedActuation: null, // do nothing (no actuation)
        expectedEmailReason: null
    },
    {
        value: 14,
        expectedActuation: 1, // swich on
        expectedEmailReason: "temperature-sensor <= 15"
    },
    {
        value: 20,
        expectedActuation: null, // do nothing (no actuation)
        expectedEmailReason: null
    },
    {
        value: 28,
        expectedActuation: 0, // swich off
        expectedEmailReason: "temperature-sensor > 25"
    }
];

process.stdout.write("_____________________________________________________________________\n".bold);
process.stdout.write("                                                                     \n");
process.stdout.write("                           OISP E2E TESTING                          \n".green.bold);
process.stdout.write("_____________________________________________________________________\n".bold);
//Callback for WSS
var cbManager = function(){

    var wssCB = null;
    return {
	"cb": function(message){
	    wssCB(message)
	},
	"set": function(newCB){wssCB = newCB}
    }
}();


describe("Waiting for OISP services to be ready ...\n".bold, function() {
    
    before(function(done) {
        userToken = null;
        accountId = null;
        deviceId = "00-11-22-33-44-55";
        deviceToken = null;
        componentId = null;
        actuatorId = null;
        rulelist = null;
        alertlist = null; 
        componentParamName = "LED";
        firstObservationTime = null;

        done();
    });

    it('Shall wait for oisp services to start', function(done) {
        var kafkaConsumer;
        var kafka_credentials = cfenvReader.getServiceCredentials("kafka-ups");
        var topic = kafka_credentials.topics.heartbeat.name;
        var partition = 0;
        var kafkaClient = new kafka.KafkaClient({kafkaHost: "localhost:9092"});
        var kafkaOffset = new kafka.Offset(kafkaClient);

        var getKafkaOffset = function(topic_, partition_, cb) {
            kafkaOffset.fetchLatestOffsets([topic_], function (error, offsets) {
                if (!error) {
                    cb(offsets[topic_][partition_])
                }
                else {
                    setTimeout( function() {
                        getKafkaOffset(topic_, partition_, cb);
                    }, 1000)
                }
            })
        };

        getKafkaOffset(topic, partition, function(offset) {
            if ( offset >= 0 ) {
                var topics = [{ topic: topic, offset: offset+1, partition: partition}]
                var options = { autoCommit: true, fromOffset: true};

                kafkaConsumer = new kafka.Consumer(kafkaClient, topics, options)

                var oispServicesToMonitor = ['rules-engine'];
                process.stdout.write("    ");
                kafkaConsumer.on('message', function (message) {
                    process.stdout.write(".".green);
                    if ( kafkaConsumer ) {
                        var now = new Date().getTime();
                        var i=0;
                        for(i=0; i<oispServicesToMonitor.length; i++) {
                            if ( oispServicesToMonitor[i] != null && oispServicesToMonitor[i].trim() === message.value.trim() ) {
                                oispServicesToMonitor[i] = null;
                            }
                        }
                        for(i=0; i<oispServicesToMonitor.length; i++) {
                            if ( oispServicesToMonitor[i] != null ) {
                                break;
                            }
                        }
                        if ( i == oispServicesToMonitor.length ) {
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
       
    }).timeout(2*60*1000);
})

describe("get authorization and manage user ...\n".bold, function() {
      
    it('Shall authenticate', function(done) {
        var username = process.env.USERNAME;
        var password = process.env.PASSWORD;
       
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
                    userId = response.payload.sub
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
                done();
            }
        }) 
    })

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
                done();
            }
        })
    })

    it('Shall refresh account activation code', function (done) {

        helpers.accounts.refreshAccountActivationCode(accountId, userToken, function (err, response) {
            if (err) {
                done(new Error("Cannot refresh account activation code: " + err));
            } else {
                done();
            }
        })
    })

    it('Shall list all users for account', function (done) {
        
        helpers.accounts.getAccountUsers(accountId, userToken, function (err, response) {
            if (err) {
                done(new Error("Cannot list users for account: " + err));
            } else {
                done();
            }
        })
    })

    it('Shall create device', function(done) {
        assert.notEqual(accountId, null, "Invalid account id")

        helpers.devices.createDevice(deviceName, deviceId, userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot create device: " + err));
            } else {
                assert.equal(response.deviceId, deviceId, 'incorrect device id')
                assert.equal(response.name, deviceName, 'incorrect device name')
                done();
            }
        })
    })

    it('Shall get a list of all devices', function(done) {

        helpers.devices.getDevices(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot get list of devices: " + err));
            } else {
                assert.equal(response[0].deviceId, deviceId, 'incorrect device id')
                done();
            }
        })
    })

    it('Shall update info of a device', function(done) {
        var deviceInfo = {
            gatewayId: deviceId,
            name: deviceName,
            loc: [ 45.12345, -130.654321, 121.1],
            tags: ["tag001", "tag002"],   
            attributes: {
                vendor: "intel",
                platform: "x64",
                os: "linux"
            }
        }
        helpers.devices.updateDeviceDetails(userToken, accountId, deviceId, deviceInfo, function(err, response) {
            if (err) {
                done(new Error("Cannot update device info: " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.deepEqual(response.attributes, deviceInfo.attributes, 'device info is not updated')
                done();
            }
        })
    })

    it('Shall list all tags for device', function(done) {

        helpers.devices.getDeviceTags(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot list all tags for device " + err));
            } else {
                assert.equal(response.length, 2, 'error tag numbers')
                done();
            }
        })
    })
        
    it('Shall list all attributes for device', function(done) {
        var attributes = {
            vendor: ["intel"],
            platform: ["x64"],
            os: ["linux"]
        }
        helpers.devices.getDeviceAttributes(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot list all attributes for device " + err));
            } else {
                assert.deepEqual(response, attributes, 'get wrong device attributes')
                done();
            }
        })
    })

    it('Shall count devices based on filter', function(done) {

        helpers.devices.countDevices(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot count devices " + err));
            } else {
                assert.equal(response.device.total, 1, 'count devices wrong')
                done();
            }
        })
    })

    it('Shall search devices based on filter', function(done) {

        helpers.devices.searchDevices(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot search devices " + err));
            } else {
                assert.equal(response[0].deviceId, deviceId, 'search wrong device')
                done();
            }
        })
    })
    
    it('Shall activate device', function(done) {
        assert.notEqual(deviceId, null, "Invalid device id")

        helpers.devices.activateDevice(userToken, accountId, deviceId, function(err, response) {
            if (err) {
                done(new Error("Cannot activate device " + err));
            } else {
                assert.isString(response.deviceToken, 'device token is not string')
                deviceToken = response.deviceToken;
                done();
            }
        })
    })
    
    it('Shall get detail of one device', function(done) {

        helpers.devices.getDeviceDetails(userToken, accountId, deviceId, function(err, response) {
            if (err) {
                done(new Error("Cannot get detail of device: " + err));
            } else {
                assert.equal(response.deviceId, deviceId, 'incorrect device id')
                assert.deepEqual(response.attributes,
                    {"vendor": "intel", "platform": "x64", "os": "linux"},
                    'incorrect device attributes' )
                done();
            }
        })
    })
})

describe("Creating and getting components ... \n".bold, function() {

    it('Shall add device a component', function(done) {

        helpers.devices.addDeviceComponent(componentName, componentType, deviceToken, accountId, deviceId, function(err, id) {
            if (err) {
                done(new Error("Cannot create component: " + err));
            } else {
                componentId = id;
                done();
            }
        })
    }).timeout(10000);

    it('Shall add device an actuator', function(done) {

        helpers.devices.addDeviceComponent(actuatorName, actuatorType, deviceToken, accountId, deviceId, function(err, id) {
            if (err) {
                done(new Error("Cannot create actuator: " + err));
            } else {
                actuatorId = id;
                done();
            }
        })
    }).timeout(10000);

    it('Shall create switch-on actuation command', function(done) {
        assert.notEqual(actuatorId, null, "Invalid actuator id")

        helpers.control.saveComplexCommand(switchOnCmdName, componentParamName, 1, userToken, accountId, deviceId, actuatorId, function(err,response) {
            if (err) {
                done(new Error("Cannot create switch-on command: " + err));
            } else {
                assert.equal(response.status, 'OK', 'get error response status')
                done();
            }
        })

    }).timeout(10000);

    it('Shall create switch-off actuation command', function(done) {
        assert.notEqual(actuatorId, null, "Invalid actuator id")

        helpers.control.saveComplexCommand(switchOffCmdName, componentParamName, 0, userToken, accountId, deviceId, actuatorId, function(err,response) {
            if (err) {
                done(new Error("Cannot create switch-off command: " + err));
            } else {
                assert.equal(response.status, 'OK', 'get error response status')
                done();
            }
        })

    }).timeout(10000);

    it('Shall send an actuation', function(done){

        helpers.control.sendActuationCommand(componentParamName, 1, userToken, accountId, actuatorId, deviceId, function(err,response) {
            if (err) {
                done(new Error("Cannot send an actuation: " + err));
            } else {
                assert.equal(response.status, 'OK', 'cannot send an actuation')
                done();
            }
        })

    })

    it('Shall get list of actuations', function(done) {

        var parameters = {
            from: 0,
            to: undefined
        }

        helpers.control.pullActuations(parameters, deviceToken, accountId, deviceId, actuatorId, function(err, response) {
            if (err) {
                done(new Error("get list of actuations: " + err));
            } else {
                assert.equal(response[0].componentId, actuatorId, 'pull error actuations')
                done();
            }
        })

    }).timeout(20000);
    
});

describe("Getting components catalog ... \n".bold, function() {

    it('Shall create a new custom Component Type', function(done) {
        helpers.cmpcatalog.createCatalog(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot create component: " + err));
            } else {
                assert.equal(response.id, 'speed.v1.0', 'cannot create new component type')
                done();
            }
        })
    }).timeout(10000);

    it('Shall list all component types for account', function(done) {
        helpers.cmpcatalog.getCatalog(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot list component: " + err));
            } else {
                assert.equal(response.length, 4, 'get wrong number of component types')
                done();
            }
        })
    }).timeout(10000);

    it('Shall get component type details', function(done) {
        helpers.cmpcatalog.getCatalogDetail(userToken, accountId, 'speed.v1.0', function(err, response) {
            if (err) {
                done(new Error("Cannot get component type details " + err));
            } else {
                assert.equal(response.id, 'speed.v1.0', 'cannot get speed component')
                assert.equal(response.max, 500)
                done();
            }
        })
    }).timeout(10000);

    it('Shall update a component type', function(done) {
        var newmin = 10;
        var newmax = 1000;
        helpers.cmpcatalog.updateCatalog(userToken, accountId, 'speed.v1.0', newmin, newmax, function(err, response) {
            if (err) {
                done(new Error("Cannot get component type details " + err));
            } else {
                assert.equal(response.id, 'speed.v1.1', 'cannot update speed component to v1.1')
                assert.equal(response.max, 1000)
                done();
            }
        })
    }).timeout(10000);
})

describe("Creating rules ... \n".bold, function() {
    it('Shall create switch-on rule', function(done) {

        rules[switchOnCmdName].cid = componentId;

        helpers.rules.createRule(rules[switchOnCmdName], userToken, accountId, deviceId, function(err, id) {
            if (err) {
                done(new Error("Cannot create switch-on rule: " + err));
            } else {
                rules[switchOnCmdName].id = id;
                done();
            }
        })

    }).timeout(20000);

    it('Shall create switch-off rule', function(done) {

        rules[switchOffCmdName].cid = componentId;

        helpers.rules.createRule(rules[switchOffCmdName], userToken, accountId, deviceId, function(err, id) {
            if (err) {
                done(new Error("Cannot create switch-off rule: " + err));
            } else {
                rules[switchOffCmdName].id = id;
                done();
            }
        })

    }).timeout(20000);
    
    it('Shall get all rules', function(done) {
        helpers.rules.getRules(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot get rules " + err));
            } else {
                assert.equal(response[0].name, 'oisp-tests-rule-high-temp', 'rule name is wrong')
                rulelist = response
                done();
            }
        })

    }).timeout(20000);
});

describe("Sending observations and checking rules ...\n".bold, function() {

    it('Shall send observation and check rules', function(done) {
        assert.notEqual(componentId, null, "Invalid component id")
        assert.notEqual(rules[switchOnCmdName].id, null, "Invalid switch-on rule id")
        assert.notEqual(rules[switchOffCmdName].id, null, "Invalid switch-off rule id")
        assert.notEqual(proxyConnector, null, "Invalid websocket proxy connector")

        var index = 0;
        var nbActuations = 0;

        process.stdout.write("    ");

        for (var i = 0; i < temperatureValues.length; i++) {
            temperatureValues[i].ts = null;
            if (temperatureValues[i].expectedActuation != null) {
                nbActuations++;
            }
        }

        var step = function(){
            index++;

            if (index == temperatureValues.length) {
                process.stdout.write("\n");
                done();
            } else {
                sendObservationAndCheckRules(index);
            }
        };

	cbManager.set(function(message) {
            --nbActuations;

            var expectedActuationValue = temperatureValues[index].expectedActuation.toString();
            var componentParam = message.content.params.filter(function(param){
                return param.name == componentParamName;
            });

            if(componentParam.length == 1)
            {
                var param = componentParam[0];
                var paramValue = param.value.toString();

                if(paramValue == expectedActuationValue)
		{
		    step();
                }
                else
                {
                    done(new Error("Param value wrong. Expected: " + expectedActuationValue + " Received: " + paramValue));
                }
	    }
            else
            {
                done(new Error("Did not find component param: " + componentParamName))
            }
        });
	helpers.connector.wsConnect(proxyConnector, deviceToken, deviceId, cbManager.cb);

        var sendObservationAndCheckRules = function(index) {

            process.stdout.write(".".green);

            helpers.devices.submitData(temperatureValues[index].value, deviceToken, accountId, deviceId, componentId, function(err, ts) {
                temperatureValues[index].ts = ts;

                if (index == 0) {
                    firstObservationTime = temperatureValues[index].ts;
                }

                if (err) {
                    done( "Cannot send observation: "+err)
                }

                if (temperatureValues[index].expectedActuation == null) {
                    step();
                }
            });
        }

        sendObservationAndCheckRules(index);

    }).timeout(5*60*1000)

    //---------------------------------------------------------------

    it('Shall check received emails', function(done){
	helpers.mail.waitForNewEmail(imap_username, imap_password, imap_host, imap_port, 7)
	    .then(() => helpers.mail.getAllEmailMessages(imap_username, imap_password, imap_host, imap_port))
	    .then( (messages) => {
		var temperatureValuesCopy =  temperatureValues.map( (elem) => elem);
		messages.forEach( (message) => {
		    var lines = message.toString().split("\n");
		    var i;
		    lines.forEach((line) => {
                        var reExecReason = /^- Reason:.*/;
                        if ( reExecReason.test(line) ) {
			    var reason = line.split(":")[1].trim();
			    var index = temperatureValuesCopy.findIndex( (element) => {
				return (reason == element.expectedEmailReason);
			    })
			    temperatureValuesCopy.splice(index, 1);
			}
                    })
		})
		assert.equal(temperatureValuesCopy.length, 3, "Received emails do not match expected emails sent from rule-engine");
		done();
	    }).catch( (err) => {done(err)});
    }).timeout(30 * 1000);

    it('Shall check observation', function(done) {
        helpers.data.searchData(firstObservationTime, userToken, accountId, deviceId, componentId, function(err, data) {
            if (err) {
                done(new Error("Cannot get data: " + err))
            }

            if (data && data.length >= temperatureValues.length) {
                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < temperatureValues.length; j++) {
                        if (temperatureValues[j].ts == data[i].ts && temperatureValues[j].value == data[i].value) {
                            temperatureValues[j].ts = null;
                        }
                    }
                }

                var err = "";
                for (var i = 0; i < temperatureValues.length; i++) {
                    if (temperatureValues[i].ts != null) {
                        err += "[" + i + "]=" + temperatureValues[i].value + " ";
                    }
                }
                if (err.length == 0) {
                    done();
                } else {
                    done(new Error("Got wrong data for " + err))
                }
            } else {
                done(new Error("Cannot get data"))
            }

        })
    }).timeout(10000);

    it('Shall check observation in advance ways', function(done) {
        helpers.data.searchDataAdvanced(firstObservationTime, userToken, accountId, deviceId, componentId, function(err, response) {
            if (err) {
                done(new Error("Cannot get data: " + err))
            }else {
                assert.equal(response.data[0].deviceId, deviceId, 'advance search fail')
                done()
            }

        })
    }).timeout(10000);
    
});

describe("Do statistics rule subtests ...".bold,
	 function() {
	     var test;
	     var descriptions = require("./subtests/statistic-rule-tests").descriptions;
	     it(descriptions.createStatisticsRules,function(done) {
		 test = require("./subtests/statistic-rule-tests").test(userToken, accountId, deviceId, deviceToken, cbManager);
		 test.createStatisticsRules(done);
             }).timeout(10000)
	     it(descriptions.sendObservations,function(done) {
		 test.sendObservations(done);
             }).timeout(50000);
	     it(descriptions.cleanup,function(done) {
		 test.cleanup(done);
	     }).timeout(10000);
         });


describe("Geting and manage alerts ... \n".bold, function(){

    it('Shall get list of alerts', function(done){
        helpers.alerts.getListOfAlerts(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot get list of alerts: " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.length, 7, 'get wrong number of alerts')
                alertlist = response
                done();
            }
        })
    })
        
    it('Shall add comments to the Alert', function(done){    
        var comments = {
            "user": "alertcomment@intel.com",
            "timestamp": 123233231221,
            "text": "comment"
        }

        helpers.alerts.addCommentsToAlert(userToken, accountId, alertlist[0].alertId, comments, function(err, response) {
            if (err) {
                done(new Error("Cannot add comments to the Alert" + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.status, 'OK')
                done();
            }
        })
    })

    it('Shall get alert infomation', function(done){    
        helpers.alerts.getAlertDetails(userToken, accountId, alertlist[0].alertId, function(err, response) {
            if (err) {
                done(new Error("Cannot get list of alerts: " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.conditions[0].condition, 'temperature-sensor > 25', 'get error alert')
                done();
            }
        })
    })

    it('Shall update alert status', function(done){     
        helpers.alerts.updateAlertStatus(userToken, accountId, alertlist[1].alertId, 'Open', function(err, response) {
            if (err) {
                done(new Error("Cannot update alert status " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.status, 'Open', 'wrong alert status')
                done();
            }
        })
    })
    
    it('Shall clear alert infomation', function(done){
        helpers.alerts.closeAlert(userToken, accountId, alertlist[2].alertId, function(err, response) {
            if (err) {
                done(new Error("Cannot clear alert infomation " + err));
            } else {
                done();
            }
        })
    })

});

describe("update rules and create draft rules ... \n".bold, function(){

    var cloneruleId;

    it('Shall clone a rule', function(done){
        var rulename_clone = rulelist[1].name + ' - cloned';
 
        helpers.rules.cloneRule (userToken, accountId, rulelist[1].id, function(err, response) {
            if (err) {
                done(new Error("cannot clone a rule " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.name, rulename_clone, 'clone error rule')
                cloneruleId = response.id
                done();
            }
        })
    })

    it('Shall update a rule', function(done) {
                
        var newrule = {
            name: "oisp-tests-rule-high-temp-new",
            synchronizationStatus: "NotSync",
            conditionComponent: componentName,
            basicConditionOperator: ">",
            basicConditionValue: "28",
            actuationCmd: switchOffCmdName,
            cid: componentId
        }

        helpers.rules.updateRule(newrule, userToken, accountId, cloneruleId, function(err, response) {
            if (err) {
                done(new Error("Cannot update rules " + err));
            } else {
                assert.equal(response.name, newrule.name, 'update rule wrong')
                done();
            }
        })

    }).timeout(20000);

    it('Shall update rule status', function(done){        
        helpers.rules.updateRuleStatus (userToken, accountId, rulelist[1].id, 'Archived', function(err, response) {
            if (err) {
                done(new Error("Cannot update rule status " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.status, 'Archived', 'wrong rule status')
                done();
            }
        })
    })

    it('Shall create a draft rule', function(done){
        helpers.rules.createDraftRule ('Draftrule', userToken, accountId,function(err, response) {
            if (err) {
                done(new Error("cannot create a draft rule " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.name, 'Draftrule', 'wrong draft rule name')
                done();
            }
        })
    })
})

describe("Adding user and posting email ...\n".bold, function() {
    it("Shall add a new user and post email", function(done) {
        assert.isNotEmpty(imap_username, "no email provided");
        assert.isNotEmpty(imap_password, "no password provided");
        helpers.users.addUser(userToken, imap_username, imap_password ,function(err, response) {
            if (err) {
                done(new Error("Cannot create new user: " + err));
            } else {
		assert.equal(response.email, imap_username, 'add wrong user')
		assert.equal(response.type, 'user', 'response type wrong')
                done();
            }
        })
    })

    it("Shall activate user with token", function(done) {
	helpers.mail.waitForNewEmail(imap_username, imap_password, imap_host, imap_port, 1)
	    .then(() => helpers.mail.getEmailMessage(imap_username, imap_password, imap_host, imap_port, -1))
	    .then(function(message) {
                var regexp = /token=\w*?\r/;
		var activationline = regexp.exec(message.toString());
                var rawactivation = activationline[0].split("token=")[1].toString();
                var activationToken = rawactivation.replace(/\r/, '')
                activationToken = activationToken.substring(2)

                if ( activationToken === null) {
		    done(new Error("Wrong email " + message ))
                }
                else {
		    assert.isString(activationToken,'activationToken is not string')

		    helpers.users.activateUser(activationToken, function(err, response) {
                        if (err) {
			    done(new Error("Cannot activate user: " + err));
                        } else {
			    assert.equal(response.status, 'OK', 'cannot activate user')

			    helpers.auth.login(imap_username, imap_password, function(err, token) {
                                if (err) {
				    done(new Error("Cannot authenticate receiver: " + err));
                                } else {
				    receiverToken = token;
				    done();
                                }
			    })
                        }
		    });
                }
            }).catch(function(err){done(err)});
    }).timeout( 60 * 1000);

    it('Shall create receiver account', function(done) {
        assert.notEqual(receiverToken, null, "Invalid user token")
        helpers.accounts.createAccount('receiver', receiverToken, function(err, response) {
            if (err) {
                done(new Error("Cannot create account: " + err));
            } else {
                assert.equal(response.name, 'receiver', "accounts name is wrong");
                receiveraccountId = response.id;
                done();
            }
        }) 
    })
});

describe("Invite receiver ...\n".bold, function() {

    var inviteId = null;

    it('Shall create invitation', function(done){
        // a mail will be sent to receiver
        
        helpers.invitation.createInvitation(userToken, accountId, imap_username, function(err, response) {
            if (err) {
                done(new Error("Cannot create invitation: " + err));
            } else {
                assert.equal(response.email, imap_username, 'send invite to wrong name');
		helpers.mail.waitAndConsumeEmailMessage(imap_username, imap_password, imap_host, imap_port).then(function(message){
                    done();
		}). catch(function(err){done(err)});
            }
        })
    }).timeout( 30 * 1000);

    
    it('Shall get all invitations', function(done){

        helpers.invitation.getAllInvitations(userToken, accountId, function(err, response) {
            if (err) {
                done(new Error("Cannot get invitation: " + err));
            } else {
                assert.equal(response[0], imap_username, 'send invite to wrong name')
                done();
            }
        })
    })
        
    it('Shall delete invitation and send again', function(done){
        helpers.invitation.deleteInvitations(userToken, accountId, imap_username, function(err, response) {
            if (err) {
                done(new Error("Cannot delete invitation: " + err));
            } else {
                helpers.invitation.createInvitation(userToken, accountId, imap_username, function(err, response) {
                    // when send invitation, the receiver will receive an email said he should login to accept the invitation
                    if (err) {
                        done(new Error("Cannot create invitation: " + err));
                    } else {
                        assert.equal(response.email, imap_username, 'send invite to wrong name');
			helpers.mail.waitAndConsumeEmailMessage(imap_username, imap_password, imap_host, imap_port).then(function(message){
                            done();
			})
                    }
                })
            }
        })
    }).timeout(30 * 1000);

    it('Shall get specific invitations', function(done){
        var getInvitation = function(cb){
        helpers.auth.login(imap_username, imap_password, function(err, token) {
            if (err) {
                done(new Error("Cannot authenticate: " + err));
            } else {
                receiverToken = token;
                helpers.invitation.getInvitations(receiverToken, receiveraccountId, imap_username, function(err, response) {
                    if (err) {
                        cb(err, null);
                    } else {
                        if (response != null){
                          cb(null, response)
                        } else {
                            process.stdout.write(".");
                            setTimeout(function(){
                                getInvitation(cb);
                            }, 500);
                        }
                    }
                })
            }   
        })
        };
       getInvitation(function(err, response){
           assert.equal(err, null, "get invitation error");
           inviteId = response[0]._id;
           done();
       });
    }).timeout(2 * 60 * 1000);

    it('Shall accept specific invitations', function(done){
        helpers.invitation.acceptInvitation(receiverToken, accountId, inviteId, function(err, response) {
            if (err) {
                done(new Error('cannot accept invitetion :' + err));
            } else {
                assert.equal(response.accountName, accountName, 'accept wrong invitation')
                done();
            }
        })
    })

    it('Shall request activation', function(done) {
        var username = process.env.USERNAME;

        helpers.users.requestUserActivation(username, function(err, response) {
            if (err) {
                done(new Error('cannot request activation:' + err));
            } else {
                    assert.equal(response.status, 'OK')
		    helpers.mail.waitAndConsumeEmailMessage(imap_username, imap_password, imap_host, imap_port).then(function(message){
			done();
		    })
            }
        })
    }).timeout( 30 * 1000);

    it('Shall get id of receiver and change privilege', function (done) {
        helpers.auth.tokenInfo(receiverToken, function (err, response) {
            if (err) {
                done(new Error("Cannot get token info: " + err));
            } else {
                receiveruserId = response.payload.sub
                helpers.accounts.changeAccountUser(accountId, userToken, receiveruserId, function (err, response) {
                    if (err) {
                        done(new Error("Cannot change another user privilege to your account: " + err));
                    } else {
                	assert.equal(response.status, 'OK')
                        done();
                    }
                })
                
            }
        })
    })
    
    it('Shall list all users for account', function (done) {
        
        helpers.accounts.getAccountUsers(accountId, userToken, function (err, response) {
            if (err) {
                done(new Error("Cannot list users for account: " + err));
            } else {
                assert.equal(response.length, 2, 'error account numbers')
		done();
            }
        })
    })
})

describe("change password and delete receiver ... \n".bold, function(){

    it('Shall request change receiver password', function(done) {
	var username = process.env.USERNAME;
	helpers.users.requestUserPasswordChange(username, function(err, response) {
            if (err) {
                done(new Error("Cannot request change password : " + err));
            } else {
                assert.equal(response.status, 'OK', 'status error')
                done();
            }
        })
    })

    it('Shall update receiver password', function(done) {
	helpers.mail.waitForNewEmail(imap_username, imap_password, imap_host, imap_port, 1)
	    .then(() => helpers.mail.getEmailMessage(imap_username, imap_password, imap_host, imap_port, -1))
	    .then(function(message) {
		var regexp = /token=\w*?\r/;
		var activationline = regexp.exec(message.toString());
		var rawactivation = activationline[0].split("token=")[1].toString();
		var activationToken = rawactivation.replace(/\r/, '')
		activationToken = activationToken.substring(2)

		if ( activationToken === null) {
                    done(new Error("Wrong email " + message ))
		}
		else {
                    assert.isString(activationToken,'activationToken is not string')
                    var password = 'Receiver12345'
                    helpers.users.updateUserPassword(activationToken, password, function(err, response) {
			if (err) {
                            done(new Error("Cannot update receiver password : " + err));
			} else {
			    assert.equal(response.status, 'OK', 'status error')
                            done();
			}
                    })
		}
            }).catch(function(err){done(err)});
    }).timeout(2 * 60 * 1000);

    it('Shall change password', function(done) {
        var username = process.env.USERNAME;
	var oldPasswd = "Receiver12345";
        var newPasswd = 'oispnewpasswd2'

        helpers.users.changeUserPassword(userToken, username, oldPasswd, newPasswd, function(err, response) {
            if (err) {
                done(new Error("Cannot change password: " + err));
            } else {
                assert.equal(response.password, 'oispnewpasswd2', 'new password error')
                done();
            }
        })
    })

    it('Shall delete draft rule', function(done){
        helpers.rules.deleteRule (userToken, accountId,   null    , function(err, response){
            if (err) {
                done(new Error("cannot delete a draft rule " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.status, 'Done')
                done();
            } 
        })
    })

    it('Shall delete a rule', function(done){
        helpers.rules.deleteRule (userToken, accountId, rulelist[0].id, function(err, response){
            if (err) {
                done(new Error("cannot delete a rule " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.status, 'Done')
                done();
            } 
        })
    })

    it('Shall delete a component', function(done){
        helpers.devices.deleteDeviceComponent (userToken, accountId, deviceId, componentId, function(err, response){
            if (err) {
                done(new Error("cannot delete a component " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.status, 'Done')
                done();
            } 
        })
    })

    it('Shall delete a device', function(done){
        helpers.devices.deleteDevice (userToken, accountId, deviceId, function(err, response){
            if (err) {
                done(new Error("cannot delete a device " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.status, 'Done')
                done();
            } 
        })
    })

    it('Shall delete an account', function(done){
        helpers.accounts.deleteAccount (userToken, accountId, function(err, response){
            if (err) {
                done(new Error("cannot delete an account " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.status, 'Done')
                done();
            } 
        })
    })

    it('Shall delete a user', function(done){
        helpers.users.deleteUser (userToken, userId, function(err, response){
            if (err) {
                done(new Error("cannot delete a user " + err));
            } else {
                assert.notEqual(response, null ,'response is null')
                assert.equal(response.status, 'Done')
                done();
            } 
        })
    })
 
})   
