#!/bin/bash

#
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
# limitations under the License

/opt/replace-hostname.sh

mkdir -p /data/logs

service ssh start

RS_CONF=/opt/hbase/conf/regionservers

if [ ! -f /etc/hosts.bak ]; then
    cp /etc/hosts /etc/hosts.bak
else
    cp /etc/hosts.bak /etc/hosts
fi

rm $RS_CONF
for rs in $REGIONSERVERS; do
    echo $rs >> $RS_CONF
done

/opt/hbase/bin/hbase master start
