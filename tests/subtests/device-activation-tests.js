var test = function(userToken, accountId) {
    var promtests = require('./promise-wrap');
    var activationCode;
    var deviceId1 = "ACTIVATION-TEST1";
    var deviceId2 = "ACTIVATION-TEST2";
    var deviceToken1;
    var deviceToken2;

    return {
        "prepareSetup": function(done) {
            promtests.createDevice("device1", deviceId1, userToken, accountId)
            .then(() => promtests.getAccountActivationCode(accountId, userToken))
            .then((res) => { activationCode = res.activationCode; })
            .then(() => { done(); })
            .catch((err) => { done(err); });
        },
        "activateExistingDeviceWithoutToken": function(done) {
            promtests.activateDeviceWithoutToken(activationCode, deviceId1).then((res) => {
                if (res.deviceToken) {
                    deviceToken1 = res.deviceToken;
                    done();
                } else {
                    done('Cannot activate device without user token.');
                }
            }).catch((err) => {
                done(err);
            });
        },
        "activateNotExistingDeviceWithoutToken": function(done) {
            promtests.activateDeviceWithoutToken(activationCode, deviceId2).then((res) => {
                if (res.deviceToken) {
                    deviceToken1 = res.deviceToken;
                    done();
                } else {
                    done('Cannot activate not existing device without token');
                }
            }).catch((err) => {
                done(err);
            });
        },
        "cleanup": function(done) {
            promtests.deleteDevice(userToken, accountId, deviceId1)
            .then(() => { promtests.deleteDevice(userToken, accountId, deviceId2) })
            .then(() => { done(); })
            .catch((err) => { done(err); });
        }
    };
};

var descriptions = {
    "prepareSetup": "Create device for subtest",
    "activateExistingDeviceWithoutToken": "Shall activate a device only with activation code",
    "activateNotExistingDeviceWithoutToken": "Shall create and activate device only with activation code",
    "cleanup": "Cleanup devices that are created for subtest",
};

module.exports = {
    test: test,
    descriptions: descriptions
};
