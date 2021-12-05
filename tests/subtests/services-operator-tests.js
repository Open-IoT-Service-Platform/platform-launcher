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

var test = function() {
    var chai = require('chai');
    const { exec } = require('child_process');
    var assert = chai.assert;
    var config = require('../test-config.json');
    const { Kafka, logLevel} = require('kafkajs');
    const kafka = new Kafka({
        clientId: "test-client",
        brokers: [`${config.connector.kafka.host}:${config.connector.kafka.port}`],
        logLevel: logLevel.NOTHING,
        retry: {
            retries: 8
        }
    });
    var consumer;
    var producer;
    const inputTopic = 'test-input';
    const outputTopic = 'test-output';
    var bsqlresource = `
apiVersion: oisp.org/v1alpha2
kind: BeamSqlTable
metadata:
    name: test-input
    namespace: oisp
spec:
    name: test-input
    connector: kafka
    fields:
    - 'cid': STRING
    - 'on': BIGINT
    - 'dvalue': AS CAST(\`value\` AS DOUBLE)
    - 'ts': AS epoch2SQL(\`on\`, 'Europe/Berlin')
    - 'value': STRING
    - 'watermark': FOR \`ts\` AS \`ts\` - INTERVAL '5' SECOND
    kafka:
        topic: ${inputTopic}
        properties:
            bootstrap.servers: ${config.connector.kafka.host}:${config.connector.kafka.port}
            fetch.message.max.bytes: 200000
        scan.startup.mode: latest-offset
    value:
        format: json
        json.fail-on-missing-field: false
        json.ignore-parse-errors: true
---
apiVersion: oisp.org/v1alpha2
kind: BeamSqlTable
metadata:
    name: test-output
    namespace: oisp
spec:
    name: test-output
    connector: upsert-kafka
    fields:
    - 'cid': STRING
    - 'value': DOUBLE
    primaryKey:
      - 'cid'
    kafka:
        topic: ${outputTopic}
        properties:
            bootstrap.servers: ${config.connector.kafka.host}:${config.connector.kafka.port}
            fetch.message.max.bytes: 200000
        key.format: json
    value:
        format: json
        json.fail-on-missing-field: false
        json.ignore-parse-errors: true
---
apiVersion: oisp.org/v1alpha2
kind: BeamSqlStatementSet
metadata:
  name: test-aggregator
  namespace: oisp
spec:
  sqlstatements:
    - |
      insert into \`test-output\`
      select cid, sum(\`dvalue\`) from \`test-input\` group by cid;
  tables:
    - test-input
    - test-output
`;

    var bsqlupdateSave = `
apiVersion: oisp.org/v1alpha2
kind: BeamSqlStatementSet
metadata:
  name: test-aggregator
  namespace: oisp
spec:
  updateStrategy: savepoint
  sqlstatements:
    - |
      insert into \`test-output\`
      select cid, sum(\`dvalue\` + 1) from \`test-input\` group by cid;
  tables:
    - test-input
    - test-output
`;

    var bsqlupdate = `
apiVersion: oisp.org/v1alpha1
kind: BeamSqlStatementSet
metadata:
  name: test-aggregator
  namespace: oisp
spec:
  sqlstatements:
    - |
      insert into \`test-output\`
      select cid, sum(\`dvalue\` + 1) from \`test-input\` group by cid;
  tables:
    - test-input
    - test-output
`;

    var submitToK8s = function(k8sResource) {
        return new Promise((resolve, reject) => {
            var execstring = `cat << "EOF"| kubectl -n oisp apply -f - 
${k8sResource} 
EOF`;
            exec(execstring, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr);
                }
                resolve();
            });
        });
    };
  

    var removeK8sObj = function(obj, name) {
        return new Promise((resolve, reject) => { 
            var execstring = `kubectl -n oisp delete ${obj}/${name}`;
            exec(execstring, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr);
                } else {
                    resolve();
                }
            });
        });
    };


    var checkReadiness = function(kind, name) {
        return new Promise((resolve) => {
            var execstring = `kubectl -n oisp get ${kind} ${name} -o yaml | grep "state: RUNNING"`;
            setInterval( () =>
                exec(execstring, (error) => {
                    if (error) {
                        process.stdout.write('.');
                    } else {
                        resolve();
                    }
                }), 1000);
        });
    };


    const initKafka = async function() {
        producer = await kafka.producer();
        await producer.connect();
        const randomGroup = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        consumer = await kafka.consumer({ groupId: randomGroup });
        await consumer.connect();
        await consumer.subscribe({ topic: outputTopic });
    };

    const startKafkaConsumer = async function() {

    };


    const stopKafkaConsumer = async function() {
        await consumer.disconnect();
        await consumer.stop();
    };



    const messages = [
        { key: 'key1', value: '{\"cid\": \"cid\", \"on\": 1, \"value\": \"1\"}' },
        { key: 'key1', value: '{\"cid\": \"cid\", \"on\": 2, \"value\": \"2\"}' },
        { key: 'key1', value: '{\"cid\": \"cid\", \"on\": 9, \"value\": \"5\"}' }
    ];
    const sendTestDataToKafka = async function() {
        await producer.send({
            topic: inputTopic,
            messages: messages,
        });
    };

    var aggrResults1 = [
        {"cid": "cid", "value": 1.0},
        {"cid": "cid", "value": 3.0},
        {"cid": "cid", "value": 8.0}
    ];

    var aggrResults2 = [
        {"cid": "cid", "value": 2.0},
        {"cid": "cid", "value": 5.0},
        {"cid": "cid", "value": 11.0}
    ];

    var aggrResults3 = [
        {"cid": "cid", "value": 13.0},
        {"cid": "cid", "value": 16.0},
        {"cid": "cid", "value": 22.0}
    ];

    var aggrProcessed;
    var aggrResultsRef;
    
    const receiveTestDataFromKafka = async function(aggrResults) {
        aggrProcessed = 0;
        aggrResultsRef = aggrResults;
        await consumer.run({
            eachMessage: ({ topic, partition, message }) => {
                var element = aggrResultsRef.shift();

                if (undefined === element) {
                    throw new Error("No element found for comparison");
                }
                var messageElement = JSON.parse(message.value.toString());
                assert.deepEqual(element, messageElement, 'Kafka element does not match');
                aggrProcessed++;
            }
        });
    };

    const waitForTestData = function() {
        return new Promise((resolve, reject) =>
            setTimeout(() => {
                if (aggrProcessed !== messages.length) {
                    reject(`Processed samples do not match with expectation: processed ${aggrProcessed}, expected ${messages.length}`);
                } else {
                    resolve();
                }}, 5000));
    };

    const waitForOperator = function(delay) {
        return new Promise((resolve) =>
            setTimeout(resolve, delay));
    };

    return {
        "prepareTestSetup": done => {
            submitToK8s(bsqlresource)
                .then(() => checkReadiness("bsqls", "test-aggregator"))
                .then(() => done())
                .catch((e) => done(e));
        },
        "SendDataToAggregatorAndCheckResult": done => {
            initKafka()
                .then(() => startKafkaConsumer())
                .then(() => receiveTestDataFromKafka(aggrResults1))
                .then(() => sendTestDataToKafka())
                .then(() => waitForTestData())
                .then(() => stopKafkaConsumer())
                .then(() => done())
                .catch((e) => done(e));

        },
        "updateTestOperator": done => {
            submitToK8s(bsqlupdate)
                .then(() => waitForOperator(5000))
                .then(() => checkReadiness("bsqls", "test-aggregator"))
                .then(() => done())
                .catch((e) => done(e));
        },
        "updateTestOperatorSave": done => {
            submitToK8s(bsqlupdateSave)
                .then(() => waitForOperator(5000))
                .then(() => checkReadiness("bsqls", "test-aggregator"))
                .then(() => done())
                .catch((e) => done(e));
        },
        "testUpgradedOperator": done => {
            initKafka()
                .then(() => startKafkaConsumer())
                .then(() => receiveTestDataFromKafka(aggrResults2))
                .then(() => sendTestDataToKafka())
                .then(() => waitForTestData())
                .then(() => stopKafkaConsumer())
                .then(() => done())
                .catch((e) => done(e));
        },
        "testUpgradedOperatorSave": done => {
            initKafka()
                .then(() => startKafkaConsumer())
                .then(() => receiveTestDataFromKafka(aggrResults3))
                .then(() => sendTestDataToKafka())
                .then(() => waitForTestData())
                .then(() => stopKafkaConsumer())
                .then(() => done())
                .catch((e) => done(e));
        },
        "cleanup": function(done) {
            removeK8sObj("bsqls", "test-aggregator")
                .then(() => removeK8sObj("bsqlt", "test-input"))
                .then(() => removeK8sObj("bsqlt", "test-output"))
                .then(() => done())
                .catch(e => done(e));
        }
    };
};

var descriptions = {
    "prepareTestSetup": "Deploy test operator and wait for readyness",
    "SendDataToAggregatorAndCheckResult": "Send data to aggregator and check result",
    "updateTestOperator": "Update test operator without savepoints",
    "testUpgradedOperator": "Send data to updated operator and check results",
    "updateTestOperatorSave": "Update test operator with savepoints",
    "testUpgradedOperatorSave": "Send data to savepoint updated operator and check results",
    "cleanup": "Cleanup test operator"
};

module.exports = {
    test: test,
    descriptions: descriptions
};
