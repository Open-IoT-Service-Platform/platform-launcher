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
# limitations under the License.

#
# Script that replaces the default hostname in files with the environments
# ${HOSTNAME} variable.
#
# This script is intended to be run before starting hbase-server 

declare -a filesToUpdate=(
	'/opt/hbase/conf/hbase-site.xml'
	'/opt/hbase/conf/zoo.cfg'
)

for file in "${filesToUpdate[@]}"; do

	if [ ! -f "${file}.bak" ]; then
		cp "${file}" "${file}.back"
	fi

	sed  "s/hbase-hostname/${HOSTNAME}/g" "${file}.back" > "${file}"

done


