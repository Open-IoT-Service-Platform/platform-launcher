var test = function(token, accountId1) {
    var promtests = require('./promise-wrap');
    var activationCode1;
    var activationCode2;
    var accountId2;
    var deviceId1 = "ACTIVATION-TEST1";
    var deviceId2 = "ACTIVATION-TEST2";
    var userToken = token;

    return {
        "prepareSetup": function(done) {
            promtests.createDevice("device1", deviceId1, userToken, accountId1)
                .then(() => promtests.getAccountActivationCode(accountId1, userToken))
                .then((res) => { activationCode1 = res.activationCode; })
                .then(() => { done(); })
                .catch((err) => { done(err); });
        },
        "activateExistingDeviceWithoutToken": function(done) {
            promtests.activateDeviceWithoutToken(activationCode1, deviceId1).then((res) => {
                if (res.deviceToken) {
                    done();
                } else {
                    done('Cannot activate device without user token.');
                }
            }).catch((err) => {
                done(err);
            });
        },
        "activateAnotherDeviceWithSameIdInAnotherAccount": function(done) {
            promtests.createAccount("ExistingDeviceIdTest", userToken)
                .then((res) => { accountId2 = res.id; })
                .then(() => promtests.authGetToken(process.env.USERNAME, process.env.PASSWORD))
                .then((grant) => { userToken = grant.token; })
                .then(() => promtests.createDevice("device1", deviceId1, userToken, accountId2))
                .then(() => promtests.getAccountActivationCode(accountId2, userToken))
                .then((res) => { activationCode2 = res.activationCode; })
                .then(() => promtests.activateDeviceWithoutToken(activationCode2, deviceId1)).then((res) => {
                    if (res.deviceToken) {
                        done();
                    } else {
                        done('Cannot activate device with same id in another account.');
                    }
                })
                .catch((err) => { done(err); });
        },
        "activateNotExistingDeviceWithoutToken": function(done) {
            promtests.activateDeviceWithoutToken(activationCode1, deviceId2).then((res) => {
                if (res.deviceToken) {
                    done();
                } else {
                    done('Cannot activate not existing device without token');
                }
            }).catch((err) => {
                done(err);
            });
        },
        "cleanup": function(done) {
            promtests.deleteDevice(userToken, accountId1, deviceId1)
                .then(() => { promtests.deleteDevice(userToken, accountId1, deviceId2); })
                .then(() => promtests.deleteAccount(userToken, accountId2))
                .then(() => { done(); })
                .catch((err) => { done(err); });
        }
    };
};

var descriptions = {
    "prepareSetup": "Create device for subtest",
    "activateExistingDeviceWithoutToken": "Shall activate a device only with activation code",
    "activateAnotherDeviceWithSameIdInAnotherAccount": "Shall create and activate another device with same id in different account",
    "activateNotExistingDeviceWithoutToken": "Shall create and activate device only with activation code",
    "cleanup": "Cleanup devices that are created for subtest",
};

module.exports = {
    test: test,
    descriptions: descriptions
};
