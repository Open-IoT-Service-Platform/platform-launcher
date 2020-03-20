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

const express = require('express'),
    Keycloak = require('keycloak-connect'),
    session = require('express-session'),
    oispSdk = require("@open-iot-service-platform/oisp-sdk-js"),
    SERVER_PORT = 4081;


const oispSdkConfig = {
    connector: {
        rest: {
            host: "frontend",
            port: 4001,
            protocol: "http",
            strictSSL: false,
            timeout: 30000,
            proxy: {
                host: false,
                port: false
            }
        }
    }
};


const oispApi = oispSdk(oispSdkConfig).api.rest,
    memoryStore = new session.MemoryStore(),
    keycloak = new Keycloak({ store: memoryStore }),
    app = express();

function getDevicesPromiseWrap(accountId, userToken) {
    return new Promise((resolve, reject) => {
        const data = {
            accountId: accountId,
            userToken: userToken
        };
        oispApi.devices.getDevices(data, (err, devices) => {
            if (err) {
                reject(err);
            } else {
                resolve(devices);
            }
        });
    });
}

app.set('views', './templates');
app.set('view engine', 'ejs');

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(keycloak.middleware( { logout: '/logout'} ));

function getRootUrl(request) {
    const host = request.hostname;
    const headerHost = request.headers.host.split(':');
    const port = headerHost[1] || '';
    const protocol = request.protocol;
    return protocol + '://' + host + (port === '' ? '' : ':' + port);
}

app.get('/', (req, res) => {
    const rootUrl = getRootUrl(req);
    const options = {
        accountsLink: rootUrl + '/accounts',
        devicesLink: rootUrl + '/devices',
        logoutLink: rootUrl + '/logout'
    };
    res.render('index', options);
});



/**
 *  req.kauth.grant object is created automatically by keycloak-connect,
 *  if the user is authenticated and has the realm role user.
 *  If not, user will not reach this point and
 *  will be stuck at keycloak login page, if the user is not authenticated
 *  otherwise user will get as response: 403 - Unauthorized).
 *  If this is not wanted, keycloak.checkSso() middleware can be used instead.
 *  For policy enforcement, look at keycloak.enforcer() middleware.
 *  All these middlewares and the automatic parsed token support are offered
 *  in all of the keycloak adapters. To check the specific documentation, look at:
 *
 *  https://www.keycloak.org/docs/latest/securing_apps/index.html#openid-connect-3
 *
 *  Currently the best supported adapters are the Java Adapters. In Node.js
 *  adapter automatic policy enforcement through keycloak.json is not supported.
 *  To learn how the policy enforcement can be done in Node.js adapter, look at:
 *
 *  https://github.com/Open-IoT-Service-Platform/oisp-frontend/tree/develop/public-interface/lib/security/keycloak
 *
 *  For other adapters you should be able to use automatic enforcement through keycloak.json:
 *
 *  https://www.keycloak.org/docs/latest/authorization_services/index.html#_enforcer_filter
 *
 */

app.get('/accounts', keycloak.protect('oisp-frontend:user'), (req, res) => {
    const accessToken = req.kauth.grant.access_token;
    const rootUrl = getRootUrl(req);
    const options = {
        email: accessToken.content.email,
        accounts: accessToken.content.accounts,
        homepageLink: rootUrl,
        logoutLink: rootUrl + '/logout'
    };
    res.render('accounts', options);
});

app.get('/devices', keycloak.protect('oisp-frontend:user'), (req, res) => {
    const rootUrl = getRootUrl(req);
    const promises = [];
    const accessToken = req.kauth.grant.access_token;
    const accounts = accessToken.content.accounts;
    for (var i = 0; i < accounts.length; i++) {
        // .token contains raw token
        promises.push(getDevicesPromiseWrap(accounts[i].id, accessToken.token));
    }
    Promise.all(promises).then(accountDevices => {
        var resultDevices = [];
        var index = 0;
        accountDevices.forEach(devices => {
            if (!devices || devices.length === 0) {
                return;
            }
            devices.forEach(device => {
                device.accountName = accounts[index].name;
                resultDevices.push(device);
            });
            index++;
        });
        const options = {
            email: accessToken.content.email,
            devices: resultDevices,
            homepageLink: rootUrl,
            logoutLink: rootUrl + '/logout'
        };
        res.render('devices', options);
    }).catch(err => {
        res.status(500).send(err);
    });
});

app.listen(SERVER_PORT, () => {
    console.log('Example SSO Client listening on port: ' + SERVER_PORT);
});
