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

echo "Stop listener started"

function clean_up {
    echo "Stop listener called"
    /opt/hbase/bin/hbase-daemon.sh stop regionserver
    exit 0;
    }
trap clean_up SIGTERM

while true; do sleep 10; done



