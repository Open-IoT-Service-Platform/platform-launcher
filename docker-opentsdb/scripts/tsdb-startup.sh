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
/opt/opentsdb/src/create_table.sh
echo "Result $?"
echo tsdb tsd $@ --auto-metric --cachedir=/tmp --staticroot=/usr/share/opentsdb/static/ --zkquorum=${ZKCLUSTER} --zkbasedir=${ZKBASE} --port=${PORT}
tsdb tsd $@ --auto-metric --cachedir=/tmp --staticroot=/usr/share/opentsdb/static/ --zkquorum=${ZKCLUSTER} --zkbasedir=${ZKBASE} --port=${PORT}
