#! /bin/bash
# restores configmaps and secrets of a namespace taken from a folder
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



usage()
{
    cat << USAGE >&2

Dumps configmaps and secrets of a namespace into folder

Usage:

    $cmdname  <tmpdir> <namespace>

    tmpdir: directory where the configmaps and secrets are dumped to. File will be tmpdir/cmname or tmpdir/secretname
    namespace: k8s namespace
USAGE
    exit 1
}

if [ "$#" -ne 2 ] || [ "$1" = "-h" ] ;
then
    usage
fi

TMPDIR=$1
NAMESPACE=$2
# we need again DB access. Because we need to change the db user passwords accourding to the new config
BNAME=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".dbname")
SUPERUSERNAME=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".su_username")
SUPERPASSWORD=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".su_password")
HOSTNAME=$(kubectl -n ${NAMESPACE} get cm/oisp-config -o jsonpath='{..postgres}'| jq ".hostname")

OISPCONFIG=($(ls ${TMPDIR}/oisp-config.json))

# sanity test. This file musst exist in a sane backup
if [ ! -f "${OISPCONFIG}" ]; then
  echo oisp-config.json not found in db backup. Bye!
  exit 1;
fi


K8SOBJECTS=($(ls ${TMPDIR}/*.json))

# debug output
if [ "${DEBUG}" = "true" ]; then
  echo main parameters:
  echo TMPDIR = ${TMPDIR}
  echo K8SOBJECTS = ${K8SOBJECTS[@]}
fi

# sanity check: If one of paramters is empty - stop
if [ "${#K8SOBJECTS[@]}" -eq 0 ]; then
  echo paramters not healthy. K8SOBJECTS is empty - Bye
  exit 1
fi

# check if one of the cm already exists
for element in "${K8SOBJECTS[@]}"
do
    kubectl replace -f $element
done
