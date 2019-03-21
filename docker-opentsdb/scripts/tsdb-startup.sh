#!/bin/bash
# Copyright (c) 2018 Intel Corporation
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

CONFIG_FILE=/etc/opentsdb/opentsdb.conf
CONFIG_SRC=/opt/opentsdb/src/opentsdb.conf
mkdir -p /etc/opentsdb
cp ${CONFIG_SRC} ${CONFIG_FILE}

function replace_config {
  config_line=$1
  replacement="${config_line} = ${2//\//\\/}"
  line_start=$3
  echo sed -i "s/${line_start}.*${config_line} =.*$/${replacement}/" ${CONFIG_FILE}
  sed -i "s/${line_start}.*${config_line} =.*$/${replacement}/" ${CONFIG_FILE}
}

function add_config {
  config_line=$1
  replacement="${config_line} = $2"
  echo ${replacement} >> ${CONFIG_FILE}
}

echo "Starting $0"
ZKCLUSTER=$(echo ${OISP_ZOOKEEPER_CONFIG} | jq   '.zkCluster' | tr -d '"')
ZKBASE=$(echo ${OISP_HADOOP_PROPERTIES} | jq   '.["hbase.rootdir"]' | tr -d '"')
PORT=$(echo ${OISP_OPENTSDB_CONFIG} | jq '.port')
echo "Found ZKCLUSTER=${ZKCLUSTER} ZKBASE=${ZKBASE} PORT=${PORT}"
export ZOOKEEPER=${ZKCLUSTER}
export HDFS_NAMENODE=not-needed # not needed
/opt/replace-hostname.sh
export HBASE_HOME=/opt/hbase
export COMPRESSION=NONE
echo status | /opt/hbase/bin/hbase shell
sleep 10
# update the config file
replace_config "tsd.storage.hbase.zk_basedir" ${ZKBASE} "#"
replace_config "tsd.storage.hbase.zk_quorum" ${ZKCLUSTER} "#"
replace_config "tsd.network.port" ${PORT} ""
replace_config "tsd.core.auto_create_metrics" "true" "#"
add_config "tsd.http.request.enable_chunked" "true"

/opt/opentsdb/src/create_table.sh
echo "Result $?"
tsdb tsd $@ --auto-metric --cachedir=/tmp --staticroot=/usr/share/opentsdb/static/
