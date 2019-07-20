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
# This needs to be exported because hbase uses a standard container
# which won't parse a JSON config
export ZOOKEEPER_HBASE='zookeeper'
ZOOKEEPER_HBASE_PORT='2181'

HBASE_ROOTDIR='/hbase'
POSTGRES='postgres'
export POSTGRES_DB_REGULAR="iot"
export POSTGRES_DB=${POSTGRES_DB_REGULAR} # postgres needs always regular DB name for initialization. It automatically initiates the test DB as well.
if [ "$TEST" = "1" ]; then
    export POSTGRES_DB='test'
    echo "Warning: Test database selected."
fi
POSTGRES_PORT='5432'
export POSTGRES_USERNAME='postgres'
export POSTGRES_PASSWORD='intel123'

# These needs to be exported as test scripts also read from Kafka
export KAFKA='kafka:9092'
export KAFKA_PORT='9092'
export KAFKA_HEARTBEAT_TOPIC='heartbeat'
GEARPUMP='gearpump:8090'
BACKEND='backend:8080'
export FRONTEND='frontend:4001'
FRONTEND_URL='frontend'
FRONTEND_PORT='4001'
export GRAFANA_PROXY_SERVER='frontend:4002'
NGINX='nginx'
NGINX_PORT='443'
REDIS='redis'
REDIS_PORT='6379'
export WEBSOCKET_SERVER="websocket-server:5000"

OPENTSDB_URI='opentsdb'
OPENTSDB_PORT=4242

export GRAFANA_PORT=3000
export GRAFANA_ADMIN='grafana'
export GRAFANA_ADMIN_PASSWORD='intel123'

MQTT_BROKER_URI='mqtt-broker'
MQTT_BROKER_PORT=8883
MQTT_BROKER_USERNAME='admin'
MQTT_BROKER_PASSWORD='8dhh1f2471'

FRONTEND_SYSTEMUSER="gateway@intel.com"
FRONTEND_SYSTEMPASSWORD="7d501829lhbl1or0bb1784462c97bcad6"

export OISP_MINIO_ACCESS_KEY="oisp/jkllaksdlkfja"
export OISP_MINIO_SECRET_KEY="8aj93h93hf91gs618hbc"
MINIO_URL="minio"
MINIO_PORT='9000'
MINIO_USE_SSL='false'


export SMTP_HOST="${SMTP_HOST:-auth.smtp.1and1.co.uk}"
export SMTP_PORT="${SMTP_PORT:-587}"
export SMTP_USERNAME="${SMTP_USERNAME:-test.sender@streammyiot.com}"
export SMTP_PASSWORD="${SMTP_PASSWORD:-xxxxx}"

OPENTSDB_PROPERTIES='{
  "uri": "'$OPENTSDB_URI'",
  "port": "'$OPENTSDB_PORT'"
}'

export COMPOSE_PROJECT_NAME="oisp"

#The root variable for every service looks like OISP_SERVICE_CONFIG
#It contains a JSON object, starting with single quote, hash names with double quotes, environmental variables with double, then single quotes, e.g. "'$VAR'"
#References to other environmental variables which can be parsed as OBJECTS are done with "@@OISP_*_CONFIG"
#References to other environmental variables which can be parsed as MAPS (e.g. Property Maps) are done with "%%OISP_*_PROPERTIES". MAPS contain only <String, String> pairs.
export OISP_BACKEND_JAEGER_CONFIG=\
'{
  "serviceName": "backend",
  "agentHost": "jaeger",
  "agentPort": 6832,
  "logSpans": true,
  "samplerType": "probabilistic",
  "samplerParam": 0.1,
  "tracing": false
}'

#export OISP_TSDB_PROPERTIES='{}'    # for HBase
export OISP_TSDB_PROPERTIES=${OPENTSDB_PROPERTIES} # for openTSDB

# tsdbName can be
# hbase
#   then no tsdbProperties should be an empty class {}
# openTSDB
#   then the OISP_TSDB_PROPERTIES should contain url and port for openTSDB service
# dummy
#   dummy backend for testing (without real storage)
# objectStorage can be
# minio
#   then the OISP_OBJECT_STORAGE_MINIO_CONFIG has to be passed in
export OISP_BACKEND_CONFIG=\
'{
  "tsdbName": "openTSDB",
  "objectStoreName": "minio",
  "tsdbProperties": "%%OISP_TSDB_PROPERTIES",
  "kafkaConfig": "@@OISP_KAFKA_CONFIG",
  "zookeeperConfig": "@@OISP_ZOOKEEPER_CONFIG",
  "kerberosConfig": "@@OISP_KERBEROS_CONFIG",
  "hbaseConfig": "@@OISP_HBASE_CONFIG",
  "jaegerConfig": "@@OISP_BACKEND_JAEGER_CONFIG",
  "objectStoreProperties": "%%OISP_OBJECT_STORE_MINIO_PROPERTIES"
}'

export OISP_OBJECT_STORE_MINIO_PROPERTIES=\
'{
  "endPoint": "'${MINIO_URL}'",
  "port": "'${MINIO_PORT}'",
  "useSSL": "'${MINIO_USE_SSL}'",
  "accessKey": "'${OISP_MINIO_ACCESS_KEY}'",
  "secretKey": "'${OISP_MINIO_SECRET_KEY}'"
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
	"gatewayConfig": "@@OISP_GATEWAY_CONFIG",
    "grafanaConfig": "@@OISP_GRAFANA_CONFIG",
    "jaegerTracing": false
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

# dataSourceHost should be the name of the data source container (e.g opentsdb)
export OISP_GRAFANA_CONFIG=\
'{
  "port": "'$GRAFANA_PORT'",
  "adminUser": "'$GRAFANA_ADMIN'",
  "adminPassword": "'$GRAFANA_ADMIN_PASSWORD'",
  "dataSourceHost": "opentsdb",
  "dataSourcePort": "'$OPENTSDB_PORT'"
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
    "frontendUri": "'${FRONTEND_URL}'",
    "frontendPort": "'${FRONTEND_PORT}'",
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
