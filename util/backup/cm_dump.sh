#! /bin/bash
# dumps configmaps and secrets of a namespace into folder
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
REMOVEFIELDS=(creationTimestamp resourceVersion uid selfLink)

# filter out the EXCLUDED and remove '""'
# Parameters: <ARRAY> <EXCLUDED>
filter()
{
  local -n ARRAY=$1
  local -n EXCL=$2
  if [ "${DEBUG}" = "true" ]; then
    echo parameters of filter:
    echo ARRAY = ${ARRAY[@]}
    echo EXCLUDED = ${EXCL[@]}
  fi
  #remove '""'
  for index in ${!ARRAY[*]}; do
    ARRAY[$index]=$(sed -e 's/^"//' -e 's/"$//' <<<${ARRAY[$index]})
  done

  # remove excluded
  for del in ${EXCL[@]}; do
    for index in ${!ARRAY[*]}; do
      if [[ "${ARRAY[$index]}" =  $del* ]]; then
        unset ARRAY[$index]
      fi
    done
  done
}


# remove not needed fields from K8s objects
# such as creationTimestamp, resourceVersion, uid, selfLink
# parameters: <filename> <array>
remove_fields()
{
  local FILENAME=$1
  local -n RMFLDS=$2

  if [ "${DEBUG}" = "true" ]; then
    echo parameters of remove_fields:
    echo FILENAME = ${FILENAME}
    echo RMFLDS = ${RMFLDS[@]}
  fi

  for field in ${RMFLDS[@]}; do
    jq "del (.metadata.$field)" ${FILENAME} > ${FILENAME}2
    mv ${FILENAME}2 ${FILENAME}
  done

}


# list deployments and sfs with their image tags
# parameters: <type>
# type: "deployment" or "statefulsets"
# return pairs of name,image_name
list_images()
{
  local TYPE=$1
  # dump deployment and StatefulSet
  local NAMES=($(kubectl -n ${NAMESPACE} get ${TYPE} -o jsonpath={...spec.template.spec.containers[*].name}))
  local IMAGES=($(kubectl -n ${NAMESPACE} get ${TYPE} -o jsonpath={...spec.template.spec.containers[*].image}))

  RETURNVAL=()
  for index in "${!NAMES[@]}";
  do
    RETURNVAL+=("${NAMES[$index]},${IMAGES[$index]}")
  done

  echo ${RETURNVAL[@]}
}


usage()
{
    cat << USAGE >&2

Dumps configmaps and secrets of a namespace into folder

Usage:

    $cmdname  <tmpdir> <namespace> <exclude>

    tmpdir: directory where the configmaps and secrets are dumped to. File will be tmpdir/cmname or tmpdir/secretname
    namespace: K8s namespace where db is located
    exclude: List of prefixes which should be excluded from backup, list is in quotes and seperated by space e.g "sh.helm dummy"
USAGE
    exit 1
}

if [ "$#" -ne 3 ] || [ "$1" = "-h" ] ;
then
    usage
fi

TMPDIR=$1
NAMESPACE=$2
EXCLUDED=($3)

RAWCMLIST=$(kubectl -n ${NAMESPACE} get cm -o json| jq '.items[].metadata.name'| tr '\n' ' ')
IFS=' ' read -r -a CMARRAY <<< "$RAWCMLIST"
RAWSECRETLIST=$(kubectl -n ${NAMESPACE} get secret -o json| jq '.items[].metadata.name'| tr '\n' ' ')
IFS=' ' read -r -a SECRETARRAY <<< "$RAWSECRETLIST"

filter CMARRAY EXCLUDED
filter SECRETARRAY EXCLUDED

# debug output
if [ "${DEBUG}" = "true" ]; then
  echo main parameters:
  echo TMPDIR = ${TMPDIR}
  echo NAMESPACE = ${NAMESPACE}
  echo EXLUDED = ${EXCLUDED[@]}
  echo CMARRAY = ${CMARRAY[@]}
  echo SECRETARRAY = ${SECRETARRAY[@]}
fi

# create working_directory
mkdir -p ${TMPDIR}

# check if one of the cm already exists
for element in "${CMARRAY[@]}"
do
    if [ -f ${TMPDIR}/${element} ]; then
      echo Configmap ${element} already in ${TMPDIR} - not overwriting - Bye
      exit 1
    fi
done

# check if one of the secrets already exists
for element in "${SECRETARRAY[@]}"
do
    if [ -f ${TMPDIR}/${element} ]; then
      echo Secret ${element} already in ${TMPDIR} - not overwriting - Bye
      exit 1
    fi
done

# write cm into folder
echo Dump configmaps of ${NAMESPACE}
for element in "${CMARRAY[@]}"
do
  kubectl -n ${NAMESPACE} get cm/${element} -o json > ${TMPDIR}/${element}.json
  remove_fields ${TMPDIR}/${element}.json REMOVEFIELDS
done


# write secret into folder
echo Dump secrets of ${NAMESPACE}
for element in "${SECRETARRAY[@]}"
do
  kubectl -n ${NAMESPACE} get secret/${element} -o json > ${TMPDIR}/${element}.json
  remove_fields ${TMPDIR}/${element}.json REMOVEFIELDS
done

# create name,image list for  DEPLOYMENTS and STATEFULSETS
DEPLOYMENTS=($(list_images deployments))
SFS=($(list_images statefulsets))

if [ "${DEBUG}" = "true" ]; then
  echo DEPLOYMENTS = ${DEPLOYMENTS[@]}
  echo SFS = ${SFS[@]}
fi

# write name,image lists to folder
echo ${DEPLOYMENTS[@]} | tr " " "\n"| sort | uniq > ${TMPDIR}/deployments
echo ${SFS[@]} | tr " " "\n"| sort |   uniq > ${TMPDIR}/statefulsets
