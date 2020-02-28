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

/**
 * Available variables:
 * user - the current user
 * realm - the current realm
 * token - the current token
 * userSession - the current userSession
 * keycloakSession - the current keycloakSession
 */

var DEVICE = "device";
var USER = "user";
var LEGACY_UID = "legacy_app_uid";
var placeholder = "placeholder@placeholder.org";

// Set expire date depending on role
var DEFAULT_EXPIRE = 5256000; // 10 years in minutes
var USER_EXPIRE = 1440; // 24 hours in minutes

var currentTimeInSeconds = new Date().getTime() / 1000;
var expire = keycloakSession.getContext().getRequestHeaders()
    .getRequestHeader("X-Token-Expire");
if (expire.length > 0) {
    expire = parseInt(expire[0]);
    token.expiration(currentTimeInSeconds + expire);
} else {
    var ArrayList = Java.type("java.util.ArrayList");
    var roles = new ArrayList();
    var client = keycloakSession.getContext().getClient();
    var forEach = Array.prototype.forEach;
    forEach.call(user.getClientRoleMappings(client).toArray(), function(roleModel) {
        roles.add(roleModel.getName());
    });
    if (roles.contains('user')) {
        token.expiration(currentTimeInSeconds + USER_EXPIRE * 60);
    } else {
        token.expiration(currentTimeInSeconds + DEFAULT_EXPIRE * 60)
    }
}

// Set type and subject id
var accessType = keycloakSession.getContext().getRequestHeaders()
    .getRequestHeader("X-Access-Type");
if (accessType.length > 0) {
    accessType = accessType[0];
}

if (accessType && accessType === DEVICE) {
    var deviceId = keycloakSession.getContext().getRequestHeaders()
        .getRequestHeader("X-DeviceID")[0];
    token.setSubject(deviceId);
    exports = DEVICE;
} else {
    // legacy uid comes from imported existing users
    var legacyUID = user.getFirstAttribute(LEGACY_UID);

    if (legacyUID) {
        token.setSubject(legacyUID);
    } else {
        token.setSubject(user.id);
    }

    if (user.username === placeholder) {
        exports = "invalid";
    } else {
        exports = USER;
    }
}
