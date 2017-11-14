#!/bin/bash

export ZOOKEEPER='hbase:2181'
export ZOOKEEPER_PORT='2181'
export POSTGRES='postgres'
export POSTGRES_PORT='5432'
export KAFKA='kafka:9092'
export GEARPUMP='gearpump:8090'
export BACKEND='backend:8080'
export NGINX='nginx'
export REDIS='redis'
export REDIS_PORT='6379'

export VCAP_SERVICES='{
"postgresql93": [{
    "credentials": {
        "dbname": "iot",
        "hostname": "'$POSTGRES'",
        "password": "intel123",
        "port": "'$POSTGRES_PORT'",
        "username": "postgres"
    },
    "name": "mypostgres"
}],
"hbase": [{
    "credentials": {
        "HADOOP_CONFIG_KEY": {
            "hadoop.security.authentication": "simple",
            "hadoop.security.authorization": "false",
            "hbase.security.authentication": "simple",
            "ha.zookeeper.quorum": "'$ZOOKEEPER'",
            "hbase.zookeeper.property.clientPort": "'$ZOOKEEPER_PORT'",
            "hbase.zookeeper.quorum": "'$ZOOKEEPER'"
        }
    },
    "name": "myhbase"
}],
"hdfs": [{
    "credentials": {
        "HADOOP_CONFIG_KEY": {
            "ha.zookeeper.quorum": "'$ZOOKEEPER'",
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
     "zk.cluster": "'$ZOOKEEPER'",
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
     "host": "auth.smtp.1and1.co.uk",
     "port": "587",
     "protocol": "smtp",
     "username": "info@streammyiot.com",
     "password": "smtp-password-goes-here"
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
        "enabled": true,
        "partitions": 1,
        "replication": 1,
        "timeout_ms": 10000,
        "topic": "metrics"
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
        "sender": "sysadmin@localhost"
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
