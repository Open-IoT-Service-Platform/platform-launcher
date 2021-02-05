#! /bin/bash
# restore database
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
DEBUG=true # uncomment to switch on debug
DUMPFILE=database.sql

# read fields from oisp-config (what is the problem? the 3rd level objects are saved as string and, thus, tough to parse as JSON)
# parameters: <filename> <field>
read_postgres_oisp_config(){
  local FILENAME=$1
  local FIELD=$2

  # hmmm
  # get the json string,
  # remove outer quotes,
  # let echo interprete the \n,
  # replace \"
  # then parse with jq, replace outer quotes
  echo -e $(jq ".data.postgres" ${FILENAME} | sed 's/^"\(.*\)"$/\1/g') | sed 's/\\"/"/g' | jq ".${FIELD}" | sed 's/^"\(.*\)"$/\1/g'
}


usage()
{
    cat << USAGE >&2

Dumps postgres database to temp directory

Usage:

    $cmdname  <tmpdir> <namespace>

    tmpdir: directory where the database.sql and oisp-config can be found
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

if kubectl -n ${NAMESPACE} get pod ${NAMESPACE}-stolon-keeper-0 > /dev/null 2>&1; then
    CONTAINER=${NAMESPACE}-stolon-keeper-0
elif kubectl -n ${NAMESPACE} get pod acid-${NAMESPACE}-1 > /dev/null 2>&1; then
    CONTAINER=acid-${NAMESPACE}-0
else
    echo "No database container found"
    exit 1
fi
echo "Found database container:" $CONTAINER

DBNAME=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".dbname")
USERNAME=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".su_username")
PASSWORD=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".su_password")
HOSTNAME=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".writeHostname")

if [ ${DEBUG} = "true" ]; then
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
  echo USERNAME is empty - Bye
  exit 1
fi

# if file does not exists, exit
if [ ! -f "${TMPDIR}/${DUMPFILE}" ]; then
  echo ${DUMPFILE} does not exists - Bye
  exit 1
fi

echo "DBONLY:" ${DBONLY}
if [ -z "${DBONLY}" ]; then
    # retrieve new passwords
    echo set new passwords
    OISPCONFIG=($(ls ${TMPDIR}/oisp-config.json))
    # sanity test. This file musst exist in a sane backup
    if [ ! -f "${OISPCONFIG}" ]; then
	echo oisp-config.json not found in db backup. Bye!
    exit 1;
    fi
    NEW_USERPASSWORD=$(read_postgres_oisp_config ${OISPCONFIG} password)
    NEW_SUPERPASSWORD=$(read_postgres_oisp_config ${OISPCONFIG} su_password)
    # sanity check: If one of paramters is empty - stop
    if [ -z "${NEW_USERPASSWORD}" ] || [ -z "${NEW_SUPERPASSWORD}" ]; then
	echo NEW_PASSWORDS are empty - Bye
    exit 1
    fi

    # Strip quotes
    PASSWORD="${PASSWORD%\"}"
    PASSWORD="${PASSWORD#\"}"
    echo "password:" ${PASSWORD}
    echo "new superpassword:" ${NEW_SUPERPASSWORD}

    echo kubectl -n ${NAMESPACE} exec -i ${CONTAINER} -- /bin/bash -c "export PGPASSWORD=${PASSWORD}; export PGSSLMODE=require; psql -h ${HOSTNAME} -U ${USERNAME}  -d ${DBNAME}"

    if (echo "ALTER USER oisp_user WITH PASSWORD '${NEW_USERPASSWORD}';" | kubectl -n ${NAMESPACE} exec -i ${CONTAINER} -- /bin/bash -c "export PGPASSWORD=${PASSWORD}; export PGSSLMODE=require; psql -h ${HOSTNAME} -U ${USERNAME}  -d ${DBNAME}"); then
	echo "User password changed"
    else
	echo "Failed to change user password."
	exit 1;
    fi
    echo "Moving on  the superuser"

    echo "ALTER USER superuser WITH PASSWORD '${NEW_SUPERPASSWORD}';" | kubectl -n ${NAMESPACE} exec -i ${CONTAINER} -- /bin/bash -c "export PGPASSWORD=${PASSWORD}; export PGSSLMODE=require;  psql -h ${HOSTNAME} -U ${USERNAME}  -d ${DBNAME} -h ${HOSTNAME}"
    echo "Password restored"
else
    SCRIPT_DIR=$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
    source ${SCRIPT_DIR}/../get_oisp_credentials.sh
    NEW_SUPERPASSWORD=${POSTGRES_SU_PASSWORD}
fi

echo restore database
kubectl -n ${NAMESPACE} exec -i ${CONTAINER} -- /bin/bash -c "mkdir -p /backup"
kubectl -n ${NAMESPACE} cp ${TMPDIR}/${DUMPFILE} ${CONTAINER}:/backup/${DUMPFILE}
kubectl -n ${NAMESPACE} exec -i ${CONTAINER} -- /bin/bash -c "export PGPASSWORD=${NEW_SUPERPASSWORD}; pg_restore -c -U ${USERNAME}  -d ${DBNAME} -h ${HOSTNAME} < /backup/${DUMPFILE}; rm -rf /backup"

echo set user rights
# retrieve new passwords and users
