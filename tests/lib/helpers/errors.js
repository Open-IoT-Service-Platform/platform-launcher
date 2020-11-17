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

'use strict';

module.exports = {
    Generic: {
        InvalidRequest: {code: 400, status: 400, message: "Invalid request"},
        NotAuthorized: {code: 401, status: 401, message: "Not Authorized"},
        RateLimit: {code: 429, status: 429, message: "Too many requests"},
        InternalServerError: {code: 500, status: 500, message: "Internal Server Error"},
        AnalyticsError: {code: 999, status: 502, message: "Error contacting backend service"}
    },
    Device: {
        InvalidData: {code: 1400, status: 400, message: "Device has some invalid data"},
        NotFound: {code: 1404, status: 404, message: "Device not found in IoT cloud. Try initializing and activating the device once again."},
        AlreadyExists: {code: 1409, status: 409, message: "Device already exists"},
        InvalidActivationCode: {code: 1410, status: 400, message: "Invalid Activation Code"},
        Component: {
            AlreadyExists: {code: 1411, status: 409, message: "At least one of Components already exist"},
            NotFound: {code: 1412, status: 404, message: "Component Not Found"},
            TypeNotFound: {code: 1511, status: 404, message: "Component Types Not Found: "},
            IdsNotUnique: {code: 1413, status: 409, message: "Component Ids in provided array are not unique: "},
            DeviceNotActive: {code: 1414, status: 400, message: "Can not add component to not active device"},
            NotExists: {code: 1412, status: 404, message: "Device has no registered components"},
            AddingError: {code: 1501, status: 500, message: "Adding component for device failed"},
            DeleteError: {code: 1502, status: 500, message: "Delete device component failed"}
        },
        SavingError: {code: 1500, status: 500, message: "Error Saving Device"},
        ActivationError: {code: 1510, status: 500, message: "Error during activation"},
        RegistrationError: {code: 1513, status: 500, message: "Error during registration"},
        DeletionError: {code: 1512, status: 500, message: "Device deletion failed"}
    },
    ComplexCommand: {
        AlreadyExists: {code: 1409, status: 409, message: "Complex command with this name already exists"},
        DoesNotExist: {code: 1404, status: 404, message: "Complex command does not exist"}
    },
    User: {
        InvalidData: {code: 2400, status: 400, message: "User has some invalid Data"},
        WeakPassword: {code: 2401, status: 400, message: "Password too Weak"},
        EmailNotVerified: {code: 2402, status: 401, message: "User's email not verified"},
        AccountLocked: {code: 2403, status: 403, message: "Account locked"},
        NotFound: {code: 2404, status: 404, message: "User Not Found"},
        TermsAndConditionsError: {code: 2405, status: 400, message: "Terms and Conditions are not accepted"},
        InvalidInteractionToken: {code: 2406, status: 400, message: "Invalid interaction token"},
        AlreadyExists: {code: 2409, status: 409, message: "User already exists"},
        Setting: {
            NotFound: {code: 2414, status: 404, message: "User Setting Not Found"},
            AlreadyExists: {code: 2419, status: 409, message: "User setting already exists"},
            SavingError: {code: 2504, status: 500, message: "Error saving settings"}
        },
        AlreadyInvited: {code: 2420, status: 409, message: "User is already invited"},
        SavingError: {code: 2500, status: 500, message: "Error Saving User"},
        CannotSendActivationEmail: {code: 2501, status: 500, message: "Could not send activation email"},
        SavingErrorAA: {code: 2502, status: 500, message: "Error Saving User"},
        DeleteErrorAA: {code: 2502, status: 500, message: "Error deleting user"},
        CannotReduceAdminPrivileges: {code: 2503, status: 500, message: "Admin privileges cannot be reduced"},
        Activation: {
            CannotUpdate: {code: 2600, status: 500, message: "Could not activate user"},
            FindByEmailError: {code: 2601, status: 500, message: "Could not activate user"},
            TokenError: {code: 2602, status: 500, message: "Could not activate user"}
        },
        CannotRemove: {
            IsOnlyAdmin: {code:2421, status: 403, message: "User cannot be removed, he is the only admin for some accounts" }
        },
        SocialLoginNotConfigured: {code:2422, status: 404, message: "Social login configuration not provided"}
    },
    Account: {
        InvalidData: {code: 3400, status: 400, message: "Account has some invalid data"},
        CannotChangeTrackSensor: {code: 3401, status: 400, message: "Cannot modify settings.trackSensorHealth"},
        NotFound: {code: 3404, status: 404, message: "Account not found"},
        AlreadyExists: {code: 3409, status: 409, message: "Account already exists"},
        SavingError: {code: 3500, status: 500, message: "Error saving Account"},
        SavingErrorAddOrUpdate: {code: 3510, status: 500, message: "Error saving Account"},
        DeletionError: {code: 3511, status: 500, message: "Error deleting Account locally"},
        DeletionErrorAA: {code: 3512, status: 500, message: "Error deleting Account on AA Proxy"},
        MaximumAccountsLimitReached: {code: 3513, status: 400, message: "User has reached maximum amount of accounts"},
        LeavingError : {
            IsSoleAdminForAccount :{ code: 3601, status: 401, message: "Could not leave Account"}
        }
    },
    Group: {
        SavingError: {code: 4500, status: 500, message: "Error saving Group"}
    },
    Component: {
        InvalidData: {code: 5400, status: 400, message: "Component has some invalid data"},
        NotFound: {code: 5404, status: 404, message: "Component not found"},
        AlreadyExists: {code: 5409, status: 409, message: "Component already exists"},
        SearchProcessingError: {code: 5410, status: 400, message: "Error processing search criteria"},
        InvalidParameterName: {code: 5411, status: 400, message: "Invalid parameter name"},
        InvalidParameterValues: {code: 5412, status: 400, message: "Invalid parameter values"}
    },
    Data: {
        InvalidData: {code: 6400, status: 400, message: "Invalid data for Target Filter"},
        PartialDataProcessed: {code: 6402, status: 404, message: "Only part of the data has been submitted successfully"},
        FormatError: {code: 6500, status: 500, message: "Format not accepted"},
        OffsetAndLimitBothOrNoneRequired:{code:6504, status:404, message:"offset and limit must be specified both or none"},
        WrongResponseCodeFromAA: {code: 6506, status: 500, message: "Could not send data."},
        SubmissionError: {code: 6505, status: 500, message: "Could not send data."},
        SendByEmail: {
            NoRecipientsProvided: {code: 6401, status: 400, message: "No email recipients were provided."}
        }
    },
    Rule: {
        InvalidData: {code: 7400, status: 400, message: "Rule has some invalid data"},
        PropertyMissing : {code: 7401, status: 401, message:"Please select at least one characteristic - name, tag or property."},
        NotFound: {code: 7404, status: 404, message: "Rule not found"},
        AlreadyExists: {code: 7409, status: 404, message: "Rule already exists"},
        NotFoundFromProxy: {code: 7444, status: 404, message: "Rule not found"},
        InternalError: {
            SavingError: {code: 7550, status: 500, message: "Error saving rule"},
            UpdatingError: {code: 7553, status: 500, message: "Error updating rule"},
            SavingNonDraftError: {code: 7554, status: 500, message: "Error saving rule. Saving rule other then draft is forbidden"},
            // error getting drafted rules
            GettingDraftedError: {code: 7556, status: 500, message: "Internal server error"}
        },
        // error getting drafted rules
        DeletionError: {code: 7557, status: 500, message: "Cannot delete draft rule"},
        // error deleting rule
        ActivatedRuleDeletionError: {code: 7558, status: 500, message: "Cannot delete rule"},
        // error as developer tried to use this API for a drafted rule
        CannotUseAPI: {code: 7600, status: 400, message: "Cannot use this API for updating a drafted rule"},
        InvalidSynchronizationStatus: {code: 7402, status: 400, message: "Invalid rule synchronization status"},
        Validation : {
            PopulationItemRequired: {code: 7710, status: 401, message:"At least one population item is required: name, ids, tags or attributes"},
            ConditionsOperatorRequired: {code: 7711, status: 401,message:"Conditions operator is required if more than one conditions values are sent"},
            ChangeDetection:{
                ConditionsNumberExceeded:{code: 7712, status: 401,
                    message:"Automatic change detection must be on the only condition in the condition set when used"},
                InvalidResetType:{code: 7713, status: 401,message:"Automatic change detection supports manual reset only"},
                BadOperator:{code: 7714, status: 401,message:"Automatic change detection takes only Equal operator"},
                ValuesNumberExceeded:{code: 7715, status: 401,message:"Automatic change detection takes only one value'"},
                InvalidValue:{code: 7716, status: 401,message:"Automatic change detection takes the following value: High, Medium or Low"}
            },
            TimeLimitRequired:{code: 7717, status: 401,message:"Timebased conditions take timeLimit parameter as required"},
            NonNumericMeasures: {
                InvalidCondition: {code: 7718, status: 401,message: "Conditions on non-numeric measures may only be of Basic condition or Timebased condition"},
                InvalidOperator:{code: 7719, status: 401,message:"Conditions on a non-numeric measure can use the Equal, Not Equal and Like operators"}
            },
            NumericMeasures:{
                InvalidOperator:{code: 7720, status: 401,
                    message:"Conditions on a numeric measure can use the >, >=, <, <=, Equal, Not Equal, Between and Not Between operators"}
            },
            MultipleValues:{
                InvalidOperator:{code: 7721, status: 401,
                    message:"Multiple Values are only supported by the Equal, Not Equal, Like, Between and Not Between operators"}
            },
            BetweenOperators:{
                TwoValuesExpected:{code: 7722, status: 401,message:'Conditions with "Between" or "Not Between" operator is expected to have 2 values'}
            },
            Statistics:{
                BaseLineSecondsBackRequired:{code: 7723, status: 401,
                    message:"Statistics Based Conditions take baselineSecondsBack parameter as required"},
                GtPositiveValueExpected:{code: 7724, status: 401,
                    message:'It is expected that for ">" or ">=" operators a positive value be sent when using Statistics Based Conditions'},
                BetweenNegativeValueExpected:{code: 7725, status: 401,
                    message:'It is expected that for "Between" or "Not Between" operators a negative value be sent when using Statistics Based Conditions'},
                EqualityOperatorsNotSupported:{code: 7726, status: 401,
                    message:"All operators except Equal, Not Equal can be used with Statistics Based Conditions"},
                BaseLineCalculationLevelRequired:{code: 7727, status: 401,
                    message:"Statistics Based Conditions take baselineCalculationLevel parameter as required"},
                LtNegativeValueExpected:{code: 7728, status: 401,
                    message:'It is expected that for "<" or "<=" operators a negative value be sent when using Statistics Based Conditions'},
                BaseLineMinimalInstancesRequired:{code: 7729, status: 401,
                    message:"Statistics Based Conditions take baselineMinimalInstances parameter as required"},
                BetweenPositiveValueExpected:{code: 7726, status: 401,
                    message:'It is expected that for "Between" or "Not Between" operators a positive value be sent when using Statistics Based Conditions'}
            },
            DeviceComponents:{
                NotFound: {code: 7731, status: 404,message:"One device for rule has no components"},
                NotInDevice: {code: 7732, status: 404,message:"One of components is not in list of devices"},
                NotUsed: {code: 7730, status: 404, message: "One of devices is not used in the rule"}
            }
        }
    },
    Alert: {
        RuleNotFound: {code: 8401, status: 400, message: "Rule associated to this alert was not found"},
        AccountNotFound: {code: 8402, status: 400, message: "Account associated to this alert was not found"},
        DeviceNotFound: {code: 8403, status: 400, message: "Device associated to this alert was not found"},
        NotFound: {code: 8404, status: 404, message: "Alert not found"},
        WrongAlertStatus: {code:8405, status: 400, message: "Wrong alert status"},
        RuleNotActive: {code:8406, status: 400, message: "Rule is not active."},
        AlreadyExists: {code: 8409, status: 409, message: "Alert already Exists"}, //Duplicate Alert
        SavingErrorAA: {code: 8500, status: 500, message: "Error saving Alert"}, //Error saving in Advanced Analytics Backend
        SavingError: {code: 8501, status: 500, message: "Error saving Alert"}, //Error saving locally
        SavingErrorComments: {code: 8502, status: 500, message: "Error saving Alert Comments"} //Error saving locally
    },
    ComponentCommands: {
        InvalidFilter: {code: 9400, status: 400, message: "Invalid Components Filter"},
        NotFound: {code: 9404, status: 404, message: "Component not found"},
        InvalidValue: {code: 9600, status: 400, message: "Invalid value"}
    },
    SensorHealth:{
        ComponentIdOrDeviceIdRequired:{code:10404, status:404,message:"At least one component ID or device ID is required."}
    },
    InteractionToken: {
        NotFound: {code: 11404, status: 404, message: "Interaction token not found"}
    },
    Actuation: {
        SearchError: {code: 12500, status: 500, message: "Error searching actuation commands."},
        SavingError: {code: 12501, status: 500, message: "Error saving actuation command."},
        DeviceNotFound: {code: 12404, status: 404, message: "Device not found in IoT cloud."}
    },
    Captcha: {
        InvalidCaptcha: {code: 13422, status: 422, message: "Invalid captcha"},
        MissingCaptcha: {code: 13423, status: 422, message: "Missing 'challenge' and 'response' fields"}
    },
    Time: {
        DateReceiveError: {code: 14500, status: 500, message: "Did not received date from system."}
    },
    Invite: {
        NotFound: {code:10404, status: 404, message: "Invitation not found"},
        DeleteError: {code:10500, status: 500, message: "Invitation deletion failed"}
    },
    RefreshToken: {
        RefreshError: {code: 15000, status: 500, message: "Error Refreshing Access Token"},
        ExpireError: {code: 15001, status: 401, message: "Refresh token has expired"},
        InvalidToken: {code: 15001, status: 401, message: "Refresh token does not exist"}
    },
};
