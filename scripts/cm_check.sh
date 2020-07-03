#! /bin/bash
# compares configmaps and secrets from a backup and K8s deployment
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


# list deployments and sfs with their image tags
# parameters: <type> <namespace>
# type: "deployment" or "statefulsets"
# return pairs of name,image_name
list_images()
{
  local TYPE=$1
  local NAMESPACE=$2
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


# check whether array and file are identical
# parameters: <array> <filename>
# array: array name of array which is compared
# filename: filename of file to be compared with array
# return "true" or "false"
check_equal()
{
  local -n ARRAY=$1
  local FILENAME=$2
  RET="true"
  index=0
  while read -r line; do
    if [ ! "$line" = "${ARRAY[$index]}" ]; then
      RET="false"
    fi
    (( index++ ))
  done < ${FILENAME}

  echo $RET
}

usage()
{
    cat << USAGE >&2

Checks configmaps and secrets of a backup and compares with namespace

Usage:

    $cmdname  <tmpdir> <namespace>

    tmpdir: directory where the configmaps and secrets are dumped to. File will be tmpdir/cmname or tmpdir/secretname
    namespace: namespace to compare with
USAGE
    exit 1
}

if [ "$#" -ne 2 ] || [ "$1" = "-h" ] ;
then
    usage
fi

TMPDIR=$1
NAMESPACE=$2

# first check whether the name,image pairs match
DEPLOYMENTS_COMP=($(list_images deployments ${NAMESPACE}| tr " " "\n" | sort | uniq))
SFS_COMP=($(list_images statefulsets ${NAMESPACE} | tr " " "\n" | sort | uniq))
RESULT1=$(check_equal DEPLOYMENTS_COMP ${TMPDIR}/deployments)
RESULT2=$(check_equal SFS_COMP ${TMPDIR}/statefulsets)

if [ "$RESULT1" = "false" ] || [ "$RESULT2" = "false" ]; then
  while true; do
      read -p "Mismatch detected between deployments and statefulsets. Be aware that this could affect the compatibility. Continue?" yn
      case $yn in
          [Yy]* ) break;;
          [Nn]* ) exit 1;;
          * ) echo "Please answer yes or no.";;
      esac
  done
fi
