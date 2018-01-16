/*
 Copyright (c) 2014, Intel Corporation

 Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var assert =  require('chai').assert;
var expect = require('chai').expect
var api = require("oisp-sdk-js").api.rest;
var mac = require("getmac");
var uuid = require('uuid/v4');
var fs = require('fs');
var proxyConnector = require('oisp-sdk-js').lib.proxies.getControlConnector("ws");
var conf = require('oisp-sdk-js').config;

var accountName = "oisp-tests";
var deviceName = "oisp-tests-device"

var componentName = "temperature-sensor"
var componentType = "temperature.v1.0"

var actuatorName = "powerswitch-actuator"
var actuatorType = "powerswitch.v1.0"

var switchOnCmdName = "switch-on"  
var switchOffCmdName = "switch-off"  

var rules = [];
		
rules[switchOnCmdName]	=	
	{
		name: "oisp-tests-rule-low-temp",
		conditionComponent: componentName,
		basicConditionOperator: "<=",
		basicConditionValue: "15",
		actuationCmd: switchOnCmdName
	};

rules[switchOffCmdName]	=	
	{
		name: "oisp-tests-rule-high-temp",
		conditionComponent: componentName,
		basicConditionOperator: ">",
		basicConditionValue: "25",
		actuationCmd: switchOffCmdName
	};

//-------------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------------

describe("OISP E2E Testing  ", function()
{
    var userToken; 
    var accountId; 
    var deviceId;
    var deviceToken;
    var componentId;
    var actuatorId;
    var ruleId;
    var pullTime;

    var temperatureValues =
    [
       	{ 
       		value: -15 , 
       		expectedActuation: 1   // swich on
       	},    	
		{ 
       		value: -5 , 
       		expectedActuation: 1   // swich on
       	},   
		{ 
       		value: 5 , 
       		expectedActuation: 1   // swich on
       	},   
		{ 
       		value: 15 , 
       		expectedActuation: 1   // swich on
       	}, 
		{ 
       		value: 25 , 
       		expectedActuation: null
       	}, 
  		{ 
       		value: 30 , 
       		expectedActuation: 0   // swich off
       	}, 
		{ 
       		value: 20 , 
       		expectedActuation: null
       	}, 
		{ 
       		value: 14 , 
       		expectedActuation: 1   // swich on
       	}, 
       	{ 
       		value: 20 , 
       		expectedActuation: null
       	}, 
  		{ 
       		value: 28 , 
       		expectedActuation: 0   // swich off
       	}, 
    ];


    before(function(done) 
    {
    	userToken = null;
    	accountId = null;	
    	deviceId = null;
    	deviceToken = null;
    	componentId = null;
    	actuatorId = null;
    	ruleId = null;
    	pullTime = null;
    	done();
  	});

    it('Shall authenticate >', function(done) 
    {
    	var username = process.env.USERNAME;
    	var password = process.env.PASSWORD;

    	assert.isNotEmpty(username, "no username provided");
    	assert.isNotEmpty(password, "no username provided");

    	login(username, password, function(err,token)
    	{
    		if (err)
    		{
    			done("Cannot authenticate: "+err);
    		}
    		else
    		{
    			userToken = token;
    			done();
    		}
    	})
    })

    it('Shall create account >', function(done) 
    {	
    	assert.notEqual(userToken, null, "Invalid user token")

		createAccount(accountName, userToken, function(err, id)
		{
			if ( err )
			{
				done("Cannot create account: "+err);
			}
			else
			{
				accountId = id;
				done();
			}
		})
	})

	it('Shall create device >', function(done) 
	{
		assert.notEqual(accountId, null, "Invalid account id")

		createDevice(deviceName, userToken, accountId, function(err,id)
		{
			if ( err )
			{
				done("Cannot create device: "+err);
			}
			else
			{
				deviceId = id;
				done();
			}
		})
	})

	it('Shall activate device >', function(done) 
	{
		assert.notEqual(deviceId, null, "Invalid device id")

		activateDevice(userToken, accountId, deviceId, function(err,token)
		{
			if ( err )
			{
				done("Cannot activate device "+err);
			}
			else
			{
				deviceToken = token;
				done();
			}
		})
	})


	it('Shall create component >', function(done) 
	{

		assert.notEqual(deviceToken, null, "Invalid device token")

		createComponent(componentName, componentType, userToken, accountId, deviceId, false,function(err,id)
		{
			if ( err )
			{
				done("Cannot create component: "+err);
			}
			else
			{
				componentId = id;
				done();
			}
		})
	}).timeout(10000);


	it('Shall create actuator >', function(done) 
	{

		assert.notEqual(deviceToken, null, "Invalid device token")

		createComponent(actuatorName, actuatorType, userToken, accountId, deviceId, false, function(err,id)
		{
			if ( err )
			{
				done("Cannot create actuator: "+err);
			}
			else
			{
				actuatorId = id;
				done();
			}
		})
	}).timeout(10000);

	it('Shall create switch-on actuation command >', function(done) 
	{

		assert.notEqual(actuatorId, null, "Invalid actuator id")

		createCommand(switchOnCmdName, 1, userToken, accountId, deviceId, actuatorId, function(err)
		{
			if ( err )
			{
				done("Cannot create switch-on command: "+err);
			}
			else
			{
				done();
			}
		})

	}).timeout(10000);

	it('Shall create switch-off actuation command >', function(done) 
	{

		assert.notEqual(actuatorId, null, "Invalid actuator id")

		createCommand(switchOffCmdName, 0, userToken, accountId, deviceId, actuatorId, function(err)
		{
			if ( err )
			{
				done("Cannot create switch-off command: "+err);
			}
			else
			{
				done();
			}
		})

	}).timeout(10000);


	it('Shall create switch-on rule >', function(done) 
	{

		assert.notEqual(deviceToken, null, "Invalid device token")

		rules[switchOnCmdName].cid = componentId;

		createRule(rules[switchOnCmdName], 0, userToken, accountId, deviceId, function(err,id)
		{
			if ( err )
			{
				done("Cannot create switch-on rule: "+err);
			}
			else
			{
				rules[switchOnCmdName].id = id;
				done();
			}
		})

	}).timeout(20000);


	it('Shall create switch-off rule >', function(done) 
	{

		assert.notEqual(deviceToken, null, "Invalid device token")

		rules[switchOffCmdName].cid = componentId;

		createRule(rules[switchOffCmdName], 0, userToken, accountId, deviceId, function(err,id)
		{
			if ( err )
			{
				done("Cannot create switch-off rule: "+err);
			}
			else
			{
				rules[switchOffCmdName].id = id;
				done();
			}
		})
		
	}).timeout(20000);

	
	it('Shall send observation and check rules>', function(done) 
	{
		assert.notEqual(componentId, null, "Invalid component id")
		assert.notEqual(rules[switchOnCmdName].id, null, "Invalid switch-on rule id")
		assert.notEqual(rules[switchOffCmdName].id, null, "Invalid switch-off rule id")
		assert.notEqual(proxyConnector, null, "Invalid device token")

		var serverReadyTimeout = 120000;
		var nbActuations = 0;
		var firstActuationIndex;

		for(var i=0; i<temperatureValues.length; i++)
		{
			temperatureValues[i].ts = null;
			if ( temperatureValues[i].expectedActuation != null )
			{
				nbActuations++;
			}
		}

		wsConnect(proxyConnector, deviceToken, deviceId, function(message)
		{
			nbActuations--;
			if ( nbActuations <= 0 )
			{
				return false;
			}
			return true;
		})

		pullTime = new Date().getTime();

		var checkActuation = function(from, expectedActuation, timeout, waitForServer, cb)
		{
			setTimeout( function() 
			{
				getActuation(from, 1, deviceToken, accountId, deviceId, actuatorId, function(err, actuations)
				{
					if ( err )
					{
						done("Cannot get actuations: "+err);
					}
					else
					{
						if ( actuations.length != 1 ||  actuations[0] != expectedActuation )
						{
							if ( waitForServer )
							{
								var now = new Date().getTime();
								if ( ( now - pullTime) >= serverReadyTimeout )
								{
									waitForServer = false;
								}
								checkActuation(from, expectedActuation, 1000, waitForServer, cb)
							}
							else
							{
								cb(false)
							}
						}
						else
						{
							cb(true)
						}
					}
				})
			}, timeout);
		}

		var sendObservationAndCheckRules = function (index) 
		{
			sendObservation(temperatureValues[index].value, deviceToken, accountId, deviceId, componentId, function(err, ts)
			{
				temperatureValues[index].ts = ts;

				if ( err )
				{
					var err = "Cannot send observation: "+err;

					if ( index == 0 ) // wait for the server to start
					{
						var now = new Date().getTime();
						if ( ( now - pullTime) < serverReadyTimeout )
						{
							err = null;
							setTimeout( function ()
							{
								sendObservationAndCheckRules(0);
							}, 1000 )
						}
					}

					if ( err )
					{
						done(err);
					}
				}
				else
				{
					if ( index == 0 )
					{
						pullTime = temperatureValues[index].ts;
					}

					if (  temperatureValues[index].expectedActuation != null )
					{
						var firstActuationIndex = 0;
		
						for(var i=0; i<temperatureValues.length; i++)
						{
							if ( temperatureValues[i].expectedActuation != null )
							{
								firstActuationIndex = i;
								break;
							}
						}

						checkActuation(temperatureValues[index].ts, temperatureValues[index].expectedActuation, 2000, index==firstActuationIndex, function(status)
						{
							if ( status )
							{
								index++;

								if ( index == temperatureValues.length )
								{
									done();
								}
								else
								{
									sendObservationAndCheckRules(index)
								}	
							}
							else
							{
								done("Got wrong actuation for [" +i+"] = "+temperatureValues[index].value)
							}

						})
					}

					else
					{
						index++;

						if ( index == temperatureValues.length )
						{
							done();
						}
						else
						{
							sendObservationAndCheckRules(index)
						}	
					}
				}
			})
		}

		sendObservationAndCheckRules(0);

	}).timeout(120000)

//---------------------------------------------------------------

	it('Shall check observation >', function(done) 
	{

		getData(pullTime, userToken, accountId, deviceId, componentId, function(err, data)
		{
			if (err)
			{
				done("Cannot get data: "+err)
			}

			if ( data && data.length >= temperatureValues.length )
			{
				for(var i=0; i<data.length; i++)
				{
					for (var j=0; j<temperatureValues.length; j++)
					{
						if ( temperatureValues[j].ts == data[i].ts && temperatureValues[j].value == data[i].value )
						{
							temperatureValues[j].ts = null;
						}
					}
				}

				var err = null;
				for (var i=0; i<temperatureValues.length; i++)
				{
					if ( temperatureValues[i].ts != null )
					{
						err += "["+i+"]="+temperatureValues[i].value+" ";
					}
				}
				if(!err)
				{
					done();
				}
				else
				{
					done("Got wrong data for "+err)
				}
			}
			else
			{
				done("Cannot get data ")
			}
			
		})
	}).timeout(10000)

})

//-------------------------------------------------------------------------------------------------------
// Helper Functions
//-------------------------------------------------------------------------------------------------------

function getDeviceId(cb) 
{
  if (!cb) 
  {
      throw "Callback required";
  }
  
  
  mac.getMac(function(err, macAddress){
      var result = null;
      if (err) {
        //Unable to get MAC address
        result = os.hostname().toLowerCase();
      } else {
        result = macAddress.replace(/:/g, '-');
      }
      cb(result);
  });
}

function getComponentId() 
{
  return uuid();
}

function getActivationCode(accountId, userToken, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

  	var data = {};
  	data.userToken = userToken;
  	data.accountId = accountId;

	api.accounts.refreshAccountActivationCode(data, function(err, response)
	{
		cb(err,response.activationCode)
	})
}

function login(username, password, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data={};


	data.body = {username: username, password: password};

	api.auth.getAuthToken(data, function(err, response)
	{
		var userToken = null;

	    if (!err)
	    {
		    assert.isString(response.token, "no access token retrieved");
		    if (response.token)
		    {
				userToken = response.token;
		    }
		}
	    cb(err,userToken);
	})
}

function wsConnect(connector, deviceToken, deviceId, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var deviceInfo =
		{
			device_id: deviceId,
			device_token: deviceToken
		};

	connector.updateDeviceInfo(deviceInfo)
	
	var data =
		{
			deviceId: deviceId
		};


	connector.controlCommandListen(data, cb, function() 
	{
    });
}


function createAccount(name, userToken, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data ={};

	data.userToken = userToken;

	api.auth.getAuthTokenInfo(data, function(err, response)
	{
		if (err)
		{
			cb(err, null)
		}
		else
		{
			var id = null;	
			assert.isString(response.payload.sub, "No userId received");

			if (response.payload.accounts)
			{
				for(var i=0; i<response.payload.accounts.length; i++)
				{
					if ( response.payload.accounts[i].name == name )
					{
						id = response.payload.accounts[i].id;
						break;
					}
				}
			}

			if (!id)
			{
				data.body = 
					{
	    				name: name
					};
				api.accounts.createAccount(data, function(err, response)
				{
				    if (!err)
				    {
					    assert.equal(response.name, name, "accounts name is wrong");
					    assert.isString(response.id, "Account id not returned");
					    
					    id = response.id;
					}
					cb(null, id);
				});
			}
			else
			{
				cb(null, id)
			}
		}
    })
}

function createDevice(name, userToken, accountId, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	getDeviceId( function(deviceId)
	{
		if ( deviceId )
		{
			var data ={};
			
			data.userToken = userToken;
			data.accountId = accountId;


			api.devices.getDevices(data, function(err, response)
			{
				if (err)
				{
					cb(err, null)
				}
				else
				{
					var found = false;

					if ( response && response.length )
					{
						for ( var i=0; i<response.length; i++)
						{
							if ( response[i].name == name && response[i].deviceId == deviceId )
							{
								found = true;
								break;
							}
						}
					}

					if (!found)
					{
						data.body = 
								{
				    				name: name,
				    				deviceId: deviceId,
				    				gatewayId: "00-11-22-33-44-55"

								}

						api.devices.createDevice(data, function(err, response)
						{
							if (err)
							{
								cb(err,null);
							}
						})
					}
					cb(null, deviceId)
				}
			})
		}
		else
		{
			cb(err,null);
		}
	})
}

function activateDevice(userToken, accountId, deviceId, cb)
{

	if (!cb) 
	{
    	throw "Callback required";
  	}

	getActivationCode(accountId,userToken, function(err, activationCode)
	{
		if (err)
		{
			cb(err);
		}
		else
		{
			var data ={};
			
			data.userToken = userToken;
			data.accountId = accountId;
			data.deviceId = deviceId;

			data.body = 
			{
				activationCode : activationCode
			}

			api.devices.activateDevice(data, function(err, response)
			{
				if (err)
				{
					cb(err);
				}
				else
				{
					cb(null,response.deviceToken);
				}
			})
		}
	})
}

function createComponent(name, type, userToken, accountId, deviceId, force, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data = 
		{
			userToken: userToken,
			accountId: accountId,
			deviceId: deviceId
		};

	api.devices.getDeviceDetails(data, function(err, response)
	{
		if (err)
		{
			cb(err);
		}
		else
		{
			var cid = getComponentId();
			var create = false;
			var i;

			for (i=0; i<response.components.length; i++)
			{
				if ( response.components[i].cid == cid || ( response.components[i].name == name && response.components[i].type == type))
				{
					if ( force )
					{
						data.cid = response.components[i].cid;

						api.devices.deleteDeviceComponent(data, function(err, response)
						{
							if (err)
							{
								cb(err);
							}
							else
							{
								createComponent(name, type, userToken, accountId, deviceId, false, cb);
							}
						})
					}
					else
					{
						cb(null,response.components[i].cid)
					}

					break;
				}
			}

			if ( i == response.components.length )
			{
				create = true;
			}

			if ( create )
			{
				data.body = 
					{
						name: name,
						type: type,
						cid: cid
					}

				api.devices.addDeviceComponent(data, function(err, response)
				{
					if (err)
					{
						cb(null);
					}
					else
					{
						cb(null,response.cid);
					}
				})
			}
		}
	})
}


function createCommand(name,onOffvalue, userToken, accountId, deviceId, actId, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data = 
		{
			userToken: userToken,
			accountId: accountId,
			commandName: name,
			body: 
				{
					commands:
					[
						{
							componentId: actId,
							transport: "ws",
							parameters: [
								{
									name: "",
									value: ""
								}
							]
						}
					]
				},
			deviceId: deviceId

		};

	api.devices.getDeviceDetails(data, function(err, response)
	{
		if (err)
		{
			cb(err);
		}
		else
		{
			var i;
			for (i=0; i<response.components.length; i++)
			{
				if ( response.components[i].cid == actId )
				{
					data.body.commands[0].parameters[0].name = response.components[i].componentType.command.parameters[0].name;
					data.body.commands[0].parameters[0].value = onOffvalue.toString();
					break;
				}
			}
			if ( i == response.components.length)
			{
				cb("Cannot get command name")
			}
			else
			{
				api.control.getComplexCommands(data, function(err, response)
				{
					for (i=0; i<response.length; i++)
					{
						if ( response[i].id == name )
						{
							api.control.updateComplexCommand(data, function(err, response)
							{
								cb(err);
							})
							break;
						}
					}

					if ( i == response.length )
					{
						api.control.saveComplexCommand(data, function(err, response)
						{
							cb(err);
						})
					}
				})	
			}
		}
	})
}

function createRule(ruleConfig, waitingTime, userToken, accountId, deviceId, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data = 
		{
			userToken: userToken,
			accountId: accountId,

			body: 
			{
				name: 			ruleConfig.name,
				description : 	"OISP testing rule",
				priority: 		"Medium",
				type:           "Regular",
				status:         "Active",
				resetType: 		"Automatic",

				actions: 		
					[
					  {
					    type: 	"actuation",
					    target: 
					    	[
					    		ruleConfig.actuationCmd
					    	]
					  }
					],


  				population: 	
  					{
				   		ids: 		[ deviceId ],
				    	attributes: null,
				    	tags:       null
				  	},
				
				conditions: 
					{
					    operator: 	"OR",
					    values: 
					    	[
							    {
							    	component: 
							      	{
							       		dataType: 	"Number",
							        	name: 	  	ruleConfig.conditionComponent,
							        	cid:        ruleConfig.cid
							      	},
							    	type: 			"basic",
							      	values: 		[ ruleConfig.basicConditionValue.toString() ],
							      	operator: 		ruleConfig.basicConditionOperator
							    }
					    	]
				  	}
			}
		};
	
	api.rules.getRules(data, function(err, response)
	{
		if (err)
		{
			cb(err)
		}
		else
		{
			if ( response.length > 0)
			{
				for( var i=0; i<response.length; i++)
				{
					ruleExists(data.body, userToken, accountId, response[i].id, i, function(err, status, index)
					{
						if ( err )
						{
							cb(err)
						}
						else if ( status )
						{
							cb(null, response[index].id);
						}
						else 
						{
							if ( response[index].name == ruleConfig.name )
							{
								deleteRule(response[index].id, userToken, accountId, function(status) {})
							}

							response[index].id = null;
							var j;

							for(j=0; j<response.length; j++)
							{
								if ( response[j].id != null )
								{
									break;
								}
							}

							if ( j==response.length )
							{		
								api.rules.createRule(data, function(err, response)
									{
										if ( err )
										{
											cb(err)
										}
										else
										{
											setTimeout(function (id)
											{
												cb(null,id)
											}, waitingTime*1000, response.id)
										}
									})
							}
						}
					})
				}
			}
			else
			{
				api.rules.createRule(data, function(err, response)
				{
					if ( err )
					{
						cb(err)
					}
					else
					{
						setTimeout(function (id)
						{
							cb(null, id)
						}, waitingTime*1000, response.id)
					}
				})
			}
		}
	})
}

function ruleExists(rule, userToken, accountId, ruleId, opaque, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data = 
		{
			userToken: userToken,
			accountId: accountId,
			ruleId: ruleId
		}

	api.rules.getRuleDetails(data, function(err, response)
	{
		var status = false;

		if (!err)
		{
			if (	response.name == rule.name &&
					response.status == rule.status && 
					response.priority == rule.priority &&
					response.resetType == rule.resetType &&
					response.actions[0].type == rule.actions[0].type &&
					response.actions[0].target[0] == rule.actions[0].target[0] &&
					response.conditions.values[0].component.name == rule.conditions.values[0].component.name &&
					response.conditions.values[0].component.cid == rule.conditions.values[0].component.cid &&
					response.conditions.values[0].values[0] == rule.conditions.values[0].values[0] &&
					response.conditions.values[0].operator == rule.conditions.values[0].operator 
				)
			{
				status = true;
			}
		}
		cb(err,status,opaque)
	});
}

function deleteRule(ruleId, userToken, accountId, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data = 
		{
			userToken: userToken,
			accountId: accountId,
			ruleId: ruleId
		}

	api.rules.deleteRule(data, function(err, response)
	{
		cb(err)
	});
}


function sendObservation(value, deviceToken, accountId, deviceId, cid, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}


  	var ts = new Date().getTime();

	var data = 
		{

			deviceToken: deviceToken,
			deviceId: deviceId,

			body:
				{
					accountId: accountId,
					on: ts,

					data: 
						[
							{
		            			componentId: cid,
		            			value: value.toString(),
		            			on: ts
		            		}
						]
				}
		}

	api.devices.submitData(data, function(err, response)
	{
		if (err)
		{
			cb(err)
		}
		else
		{
			cb(null,ts);
		}
	})

}

function getActuation(from, maxItems, deviceToken, accountId, deviceId, cid, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data = 
		{
			from: from,
			deviceToken: deviceToken,
			accountId: accountId,
			deviceId: deviceId
		}

	var actuations = [];

	api.control.pullActuations(data, function(err, response)
	{
		if ( err )
		{
			cb(err)
		}
		else
		{
			for (var i=0; i<response.length; i++)
			{
				if ( response[i].componentId == cid)
				{
					if ( actuations.length < maxItems )
					{
						actuations.push(response[i].parameters[0].value);
					}
					else
					{
						break;
					}
				}
			}

			cb(null, actuations)
		}
	})

}


function getObservation(ts, userToken, accountId, deviceId, cid, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data = 
	{
		userToken: userToken,
		accountId: accountId,
		body:
			{
		        from: ts,
		        targetFilter: 
			        {
			            deviceList: [deviceId]
			        },
		        metrics: 
			        [
			            {
			                id: cid
			            }
			        ]
			}
    }

	api.data.searchData(data, function(err, response)
	{
		var found = false;

		if ( err )
		{
			cb(err);
		}
		else
		{	
			if ( response.series )
			{
				for (var i=0; i<response.series.length; i++)
				{
					for(var j=0; j<response.series[i].points.length;j++)
					{
						if (response.series[i].points[j].ts == ts)
						{
							found = true;
							cb(null, ts, parseInt(response.series[i].points[j].value));
							break;
						}
					}
				}
			}
		
			if ( !found )
			{
				cb(null, ts, null);
			}
		}
	})
}

function getData(from, userToken, accountId, deviceId, cid, cb)
{
	if (!cb) 
	{
    	throw "Callback required";
  	}

	var data = 
	{
		userToken: userToken,
		accountId: accountId,
		body:
			{
		        from: from,
		        targetFilter: 
			        {
			            deviceList: [deviceId]
			        },
		        metrics: 
			        [
			            {
			                id: cid
			            }
			        ]
			}
    }

	api.data.searchData(data, function(err, response)
	{
		if ( err )
		{
			cb(err)
		}
		else
		{	
			if ( response.series )
			{
				cb(null,response.series[0].points)
			}
		}
	
	})

}



