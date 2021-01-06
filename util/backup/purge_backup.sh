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
DEBUG=true # uncomment to switch on debug


# checks whether monthly backup is already stored for the month
# parameters: <tmpdir> <filename>
# returns monthly name if a mohthly not already exists
check_monthly()
{
    local filename=$2
    local tmpdir=$1
    local monthly=${filename/daily/monthly}
    local pattern='^(backup_.*_monthly_).*'
    [[ $monthly =~ $pattern ]]
    local monthly_prefix=${BASH_REMATCH[1]}$(date +"%Y-%m")
    if [ "${DEBUG}" = "true" ]; then
        echo $filename - $tmpdir - $monthly -  $monthly_prefix >&2
    fi 
    if [ ! -f "$tmpdir/$monthly_prefix*" ]; then
        echo $monthly
    fi
}


# return the filelist
# parameters: <tmpdir>
# tmpdir: name of dir or bucket
# return "true" or "false"
getdailyfilelist()
{
    local tmpdir=$1
    echo $(cd ${tmpdir}; ls backup_*_daily_*.tgz)
}

usage()
{
    cat << USAGE >&2

Deletes old backup files

Usage:

    $cmdname  <tmpdir>

    tmpdir: directory/bucket where the backups are located
USAGE
    exit 1
}

if [ "$#" -ne 1 ] || [ "$1" = "-h" ] ;
then
    usage
fi

#SECONDSPERWEEK=$(( 60*60*24*7 ))
SECONDSPERWEEK=$(( 7 ))
TMPDIR=$1

NOW=$(date +"%s")
PATTERN='^backup.*_(.*)\.tgz$'
FILELIST=$(getdailyfilelist ${TMPDIR})

if [ "${DEBUG}" = "true" ]; then
    echo ${FILELIST}
fi

PURGELIST=()
for value in ${FILELIST}; do
    [[ $value =~ ${PATTERN} ]]
    timestamp=$(date +"%s" -d "${BASH_REMATCH[1]}")
    diff=$(( $NOW - $timestamp ));
    if [ "$diff" -gt ${SECONDSPERWEEK} ]; then
        PURGELIST+=(${BASH_REMATCH[0]})
    fi
done

if [ "${DEBUG}" = "true" ]; then
    echo Purge list ${PURGELIST[@]}
fi

for value in ${PURGELIST}; do
    result=$(check_monthly $TMPDIR ${PURGELIST[0]})
    if [ ! -z "$result" ]; then
        mv $TMPDIR/${value} ${TMPDIR}/$result
    fi
done