#!/bin/bash
#
# Copyright (c) 2017 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

export DOCKER_TAG=${DOCKER_TAG:-'latest'}

export ZOOKEEPER_KAFKA='kafka'
export ZOOKEEPER_KAFKA_PORT='2181'
export ZOOKEEPER_HBASE='hbase'
export ZOOKEEPER_HBASE_PORT='2181'
export POSTGRES='postgres'
export POSTGRES_DB_REGULAR="iot"
export POSTGRES_DB=${POSTGRES_DB_REGULAR} # postgres needs always regular DB name for initialization. It automatically initiates the test DB as well.
if [ "$TEST" = "1" ]; then
    export POSTGRES_DB='test'
    echo "Warning: Test database selected."
fi
export POSTGRES_PORT='5432'
export POSTGRES_USERNAME='postgres'
export POSTGRES_PASSWORD='intel123'
export KAFKA='kafka:9092'
export KAFKA_HEARTBEAT_TOPIC='heartbeat'
export GEARPUMP='gearpump:8090'
export BACKEND='backend:8080'
export NGINX='nginx'
export REDIS='redis'
export REDIS_PORT='6379'

export SMTP_HOST="${SMTP_HOST:-auth.smtp.1and1.co.uk}"
export SMTP_PORT="${SMTP_PORT:-587}"
export SMTP_USERNAME="${SMTP_USERNAME:-test.sender@streammyiot.com}"
export SMTP_PASSWORD="${SMTP_PASSWORD:-xxxxx}"

export COMPOSE_PROJECT_NAME="oisp"

export VCAP_SERVICES='{
"postgresql93": [{
    "credentials": {
    "dbname": "'$POSTGRES_DB'",
    "hostname": "'$POSTGRES'",
    "password": "'$POSTGRES_PASSWORD'",
    "port": "'$POSTGRES_PORT'",
    "username": "'$POSTGRES_USERNAME'"
    },
    "name": "mypostgres"
}],
    "websocket-server": [{
        "server-name": "websocket-server",
        "name": "mywsserver"
}],
"hbase": [{
    "credentials": {
    "HADOOP_CONFIG_KEY": {
        "hadoop.security.authentication": "simple",
        "hadoop.security.authorization": "false",
        "hbase.security.authentication": "simple",
        "ha.zookeeper.quorum": "'$ZOOKEEPER_HBASE'",
        "hbase.zookeeper.property.clientPort": "'$ZOOKEEPER_HBASE_PORT'",
        "hbase.zookeeper.quorum": "'$ZOOKEEPER_HBASE'"
    }
    },
    "name": "myhbase"
}],
"hdfs": [{
    "credentials": {
    "HADOOP_CONFIG_KEY": {
        "ha.zookeeper.quorum": "'${ZOOKEEPER_HBASE}':'${ZOOKEEPER_HBASE_PORT}'",
        "hadoop.security.authorization": "false"
    }
    },
    "name": "myhdfs"
}],
"kafka": [{
    "credentials": {
    "uri": "'$KAFKA'"
    },
    "name": "mykafka"
}],
"zookeeper": [{
    "credentials": {
     "zk.cluster": "'${ZOOKEEPER_KAFKA}:${ZOOKEEPER_KAFKA_PORT}'",
     "zk.node": "/tmp"
    },
    "label": "zookeeper",
    "name": "myzookeeper",
    "plan": "local",
    "tags": []
}],
"gearpump": [{
    "credentials": {
     "username": "admin",
     "password": "admin",
     "dashboardUrl": "'$GEARPUMP'"
    },
    "name": "mygearpump"
}],
"smtp": [
   {
    "credentials": {
     "host": "'$SMTP_HOST'",
     "port": "'$SMTP_PORT'",
     "protocol": "smtp",
     "username": "'$SMTP_USERNAME'",
     "password": "'$SMTP_PASSWORD'"
    },
    "label": "smtp",
    "name": "mysmtp"
   }
  ],
"redis": [
   {
    "credentials": {
     "hostname": "'$REDIS'",
     "port": "'$REDIS_PORT'",
     "password": ""
    },
    "label": "redis",
    "name": "myredis"
   }
  ],
"user-provided": [{
    "credentials": {
    "kdc": "localhost",
    "kpassword": "pass",
    "krealm": "realm",
    "kuser": "user"
    },
    "name": "kerberos-service"
},
{
    "credentials": {
    "hosts": "'$KAFKA'",
    "enabled": true,
    "partitions": 1,
    "replication": 1,
    "timeout_ms": 10000,
    "topics": {
                    "observations": "metrics",
                    "rule_engine": "rules-update",
                    "heartbeat": {
                        "name": "'$KAFKA_HEARTBEAT_TOPIC'",
                        "interval": 5000
                    }
                }
    },
    "name": "kafka-ups"
},
{
    "credentials": {
    "host": "http://'$NGINX'",
    "strictSSL": false
    },
    "name": "dashboard-endpoint-ups"
},
{
    "credentials": {
    "captcha_test_code": "s09ef48213s8fe8fw8rwer5489wr8wd5",
    "interaction_token_permision_key": "password",
    "private_pem_path": "./keys/private.pem",
    "public_pem_path": "./keys/public.pem"
    },
    "name": "dashboard-security-ups"
},
{
    "credentials": {
    "deviceMeasurementTableName": "LOCAL-AA-BACKEND_DEVICE_MEASUREMENT",
    "host": "http://'$BACKEND'"

    },
    "name": "backend-ups"
},
{
    "credentials": {
    "sender": "test.sender@streammyiot.com"
    },
    "name": "mail-ups"
},
{
    "credentials": {
    "password": "7d501829lhbl1or0bb1784462c97bcad6",
    "username": "gateway@intel.com"

    },
    "name": "gateway-credentials-ups"
},
{
    "credentials": {
    "password": "7d501829lhbl1or0bb1784462c97bcad6",
    "username": "rule_engine@intel.com"

    },
    "name": "rule-engine-credentials-ups"
},
{
    "credentials": {
    "password": "AgjY7H3eXztyA6AmNjI2rte446gdttgattwRRF61",
    "username": "api_actuator"
    },
    "name": "websocket-ups"
}]
}'

export VCAP_APPLICATION='{
    "space_name": "local"
}'
