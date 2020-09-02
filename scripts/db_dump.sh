#! /bin/bash
# dumps database to tmp directory
#
# Copyright (c) 2020 Intel Corporation
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


cmdname=$(basename $0)
#DEBUG=true # uncomment to switch on debug
DUMPFILE=database.sql

usage()
{
    cat << USAGE >&2

Dumps postgres database to temp directory

Usage:

    $cmdname  <tmpdir> <namespace>

    tmpdir: directory where the database is dumped to. File will be tmpdir/database.sql
    namespace: K8s namespace where db is located
USAGE
    exit 1
}

if [ "$#" -ne 2 ] || [ "$1" = "-h" ] ;
then
    usage
fi

TMPDIR=$1
NAMESPACE=$2
CONTAINER=${NAMESPACE}-stolon-keeper-0
DBNAME=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".dbname")
USERNAME=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".su_username")
PASSWORD=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".su_password")
HOSTNAME=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".hostname")

if [ "${DEBUG}" = "true" ]; then
  echo parameters:
  echo TMPDIR = ${TMPDIR}
  echo NAMESPACE = ${NAMESPACE}
  echo DBNAME = ${DBNAME}
  echo USERNAME = ${USERNAME}
  echo PASSWORD = ${PASSWORD}
  echo HOSTNAME = ${HOSTNAME}
fi

# sanity check: If one of paramters is empty - stop
if [ -z "${USERNAME}" ] || [ -z "${DBNAME}" ] || [ -z "${PASSWORD}" ] || [ -z "${HOSTNAME}" ]; then
  echo paramters not healthy. Some are empty - Bye
  exit 1
fi
# create dir
mkdir -p ${TMPDIR}
# if file exists, exit
if [ -f "${TMPDIR}/${DUMPFILE}" ]; then
  echo file alredy exists - will not overwriet - Bye
  exit 1
fi

echo Dump database
kubectl -n ${NAMESPACE} exec ${CONTAINER} -- /bin/bash -c "export PGPASSWORD=${PASSWORD}; pg_dump -U ${USERNAME} ${DBNAME} -h ${HOSTNAME} -F c -b " > ${TMPDIR}/${DUMPFILE}
