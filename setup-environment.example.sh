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

export ZOOKEEPER_KAFKA='zookeeper'
export ZOOKEEPER_KAFKA_PORT='2181'
export ZOOKEEPER_HBASE='zookeeper'
export ZOOKEEPER_HBASE_PORT='2181'

HBASE_ROOTDIR='/hbase'
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
export KAFKA_PORT='9092'
export KAFKA_HEARTBEAT_TOPIC='heartbeat'
export GEARPUMP='gearpump:8090'
export BACKEND='backend:8080'
export FRONTEND='frontend:4001'
export NGINX='nginx'
NGINX_PORT='443'
export REDIS='redis'
export REDIS_PORT='6379'

OPENTSDB_URI='opentsdb'
OPENTSDB_PORT=4242

MQTT_BROKER_URI='mqtt-broker'
MQTT_BROKER_PORT=8883
MQTT_BROKER_USERNAME='admin'
MQTT_BROKER_PASSWORD='8dhh1f2471'

FRONTEND_SYSTEMUSER="gateway@intel.com"
FRONTEND_SYSTEMPASSWORD="7d501829lhbl1or0bb1784462c97bcad6"

export SMTP_HOST="${SMTP_HOST:-auth.smtp.1and1.co.uk}"
export SMTP_PORT="${SMTP_PORT:-587}"
export SMTP_USERNAME="${SMTP_USERNAME:-test.sender@streammyiot.com}"
export SMTP_PASSWORD="${SMTP_PASSWORD:-xxxxx}"

export COMPOSE_PROJECT_NAME="oisp"


OPENTSDB_PROPERTIES='{
  "uri": "'$OPENTSDB_URI'",
  "port": "'$OPENTSDB_PORT'"
}'

#The root variable for every service looks like OISP_SERVICE_CONFIG
#It contains a JSON object, starting with single quote, hash names with double quotes, environmental variables with double, then single quotes, e.g. "'$VAR'"
#References to other environmental variables which can be parsed as OBJECTS are done with "@@OISP_*_CONFIG"
#References to other environmental variables which can be parsed as MAPS (e.g. Property Maps) are done with "%%OISP_*_PROPERTIES". MAPS contain only <String, String> pairs.

export OISP_TSDB_PROPERTIES='{}'    #=${OPENTSDB_PROPERTIES} for openTSDB

# tsdbName can be
# hbase
#   then no tsdbProperties should be an empty class {}
# opentsdb
#   then the OISP_TSDB_PROPERTIES should contain url and port for openTSDB service
export OISP_BACKEND_CONFIG=\
'{
  "tsdbName": "hbase",
  "tsdbProperties": "%%OISP_TSDB_PROPERTIES",
  "kafkaConfig": "@@OISP_KAFKA_CONFIG",
  "zookeeperConfig": "@@OISP_ZOOKEEPER_CONFIG",
  "kerberosConfig": "@@OISP_KERBEROS_CONFIG",
  "hbaseConfig": "@@OISP_HBASE_CONFIG"
}'

export OISP_FRONTEND_CONFIG=\
'{
	"postgresConfig": "@@OISP_POSTGRES_CONFIG",
	"redisConfig": "@@OISP_REDIS_CONFIG",
	"kafkaConfig": "@@OISP_KAFKA_CONFIG",
	"smtpConfig": "@@OISP_SMTP_CONFIG",
	"dashboardSecurityConfig": "@@OISP_DASHBOARDSECURITY_CONFIG",
	"backendHostConfig": "@@OISP_BACKENDHOST_CONFIG",
	"websocketUserConfig": "@@OISP_WEBSOCKETUSER_CONFIG",
	"mailConfig": "@@OISP_MAIL_CONFIG",
	"ruleEngineConfig": "@@OISP_RULEENGINE_CONFIG",
	"gatewayConfig": "@@OISP_GATEWAY_CONFIG"
}'

export OISP_WEBSOCKET_SERVER_CONFIG=\
'{
	"postgresConfig": "@@OISP_POSTGRES_CONFIG",
	"websocketUserConfig": "@@OISP_WEBSOCKETUSER_CONFIG",
	"kafkaConfig": "@@OISP_KAFKA_CONFIG",
	"uri": ""
}'

export OISP_KAFKA_CONFIG=\
'{
  "uri": "'$KAFKA'",
  "partitions": 1,
  "replication": 1,
  "timeoutMs": 10000,
  "topicsObservations": "metrics",
  "topicsRuleEngine": "rules-update",
  "topicsHeartbeatName": "'$KAFKA_HEARTBEAT_TOPIC'",
  "topicsHeartbeatInterval": 5000
}'

export OISP_ZOOKEEPER_CONFIG=\
'{
  "zkCluster": "'${ZOOKEEPER_KAFKA}:${ZOOKEEPER_KAFKA_PORT}'"
'}

export OISP_KERBEROS_CONFIG=\
'{
  "kdc": "localhost",
  "kpassword": "pass",
  "krealm": "realm",
  "kuser": "user"
}'

export OISP_HBASE_CONFIG=\
'{
  "hadoopProperties": "%%OISP_HADOOP_PROPERTIES"
}'

export OISP_HADOOP_PROPERTIES=\
'{
  "hadoop.security.authentication": "simple",
  "hadoop.security.authorization": "false",
  "hbase.security.authentication": "simple",
  "ha.zookeeper.quorum": "'$ZOOKEEPER_HBASE'",
  "hbase.zookeeper.property.clientPort": "'$ZOOKEEPER_HBASE_PORT'",
  "hbase.zookeeper.quorum": "'$ZOOKEEPER_HBASE'",
  "hbase.rootdir": "'$HBASE_ROOTDIR'"
}'

export OISP_OPENTSDB_CONFIG=\
'{
  "port": '$OPENTSDB_PORT'
}'

export OISP_POSTGRES_CONFIG=\
'{
  "dbname": "'$POSTGRES_DB'",
  "hostname": "'$POSTGRES'",
  "password": "'$POSTGRES_PASSWORD'",
  "port": "'$POSTGRES_PORT'",
  "username": "'$POSTGRES_USERNAME'"
}'

export OISP_REDIS_CONFIG=\
'{
  "hostname": "'$REDIS'",
  "port": "'$REDIS_PORT'",
  "password": ""
}'

export OISP_SMTP_CONFIG=\
'{
  "host": "'$SMTP_HOST'",
  "port": "'$SMTP_PORT'",
  "protocol": "smtp",
  "username": "'$SMTP_USERNAME'",
  "password": "'$SMTP_PASSWORD'"
}'

export OISP_DASHBOARDSECURITY_CONFIG=\
'{
  "captcha_test_code": "s09ef48213s8fe8fw8rwer5489wr8wd5",
  "interaction_token_permision_key": "password",
  "private_pem_path": "./keys/private.pem",
  "public_pem_path": "./keys/public.pem"
}'

export OISP_GATEWAY_CONFIG=\
'{
  "password": "7d501829lhbl1or0bb1784462c97bcad6",
  "username": "gateway@intel.com"
}'

export OISP_BACKENDHOST_CONFIG=\
'{
 	"deviceMeasurementTableName": "LOCAL-AA-BACKEND_DEVICE_MEASUREMENT",
    "host": "http://'$BACKEND'"
}'

export OISP_MAIL_CONFIG=\
'{
 	"sender": "test.sender@streammyiot.com"
}'

export OISP_RULEENGINE_CONFIG=\
'{
    "uri": "gearpump:8090",
    "password": "7d501829lhbl1or0bb1784462c97bcad6",
    "username": "rule_engine@intel.com",
    "gearpumpUsername": "admin",
    "gearpumpPassword": "admin",
    "frontendUri": "'$FRONTEND'",
    "hbaseConfig": "@@OISP_HBASE_CONFIG",
    "kafkaConfig": "@@OISP_KAFKA_CONFIG",
    "zookeeperConfig": "@@OISP_ZOOKEEPER_CONFIG"
}'

export OISP_GATEWAY_CONFIG=\
'{
    "password": "7d501829lhbl1or0bb1784462c97bcad6",
    "username": "gateway@intel.com"
}'

export OISP_WEBSOCKETUSER_CONFIG=\
'{
	"password": "AgjY7H3eXztyA6AmNjI2rte446gdttgattwRRF61",
    "username": "api_actuator"
}'

export OISP_MQTT_GATEWAY_CONFIG=\
'{
    "mqttBrokerUrl": "'${MQTT_BROKER_URI}'",
    "mqttBrokerPort": "'${MQTT_BROKER_PORT}'",
    "mqttBrokerUsername": "'${MQTT_BROKER_USERNAME}'",
    "mqttBrokerPassword": "'${MQTT_BROKER_PASSWORD}'",
    "frontendUri": "'${NGINX}'",
    "frontendPort": "'${NGINX_PORT}'",
    "frontendSystemUser": "'${FRONTEND_SYSTEMUSER}'",
    "frontendSystemPassword": "'${FRONTEND_SYSTEMPASSWORD}'",
    "redisConf": "@@OISP_REDIS_CONFIG",
    "aesKey": "/app/keys/mqtt/mqtt_gw_secret.key"
}'

export OISP_MQTT_BROKER_CONFIG=\
'{
    "redisConf": "@@OISP_REDIS_CONFIG",
    "jwtPubKey": "/app/keys/public.pem",
    "mqttBrokerUserName": "'${MQTT_BROKER_USERNAME}'",
    "mqttBrokerPassword": "'${MQTT_BROKER_PASSWORD}'",
    "mqttBrokerPort": "'${MQTT_BROKER_PORT}'",
    "aesKey": "/app/keys/mqtt/mqtt_gw_secret.key",
    "cafile": "/app/keys/ssl/server.cert",
    "keyfile": "/app/keys/ssl/server.key",
    "certfile": "/app/keys/ssl/server.cert"
 }'
