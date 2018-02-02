#!/bin/bash
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


