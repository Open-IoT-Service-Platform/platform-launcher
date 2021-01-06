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
DRYRUN=true # uncomment to avoid filesystem commands


# checks whether monthly backup is already stored for the month
# parameters: <tmpdir> <filename>
# returns monthly name if a mohthly not already exists
check_monthly()
{
    local filename=$2
    local tmpdir=$1
    local monthly=${filename/daily/monthly}
    local pattern='(^backup_.*_monthly_[0-9]{4}-[0-9]{2}).*'
    [[ $monthly =~ $pattern ]]
    local monthly_prefix=${BASH_REMATCH[1]}
    if [ "${DEBUG}" = "true" ]; then
        echo check_monthly debug: $filename - $tmpdir - $monthly -  $monthly_prefix >&2
    fi 
    if [ ! -z "$monthly_prefix" ] && [ -z "$(ls $tmpdir/$monthly_prefix* 2>/dev/null)" ]; then
        echo $monthly
    fi
}


# return the filelist
# parameters: <type> <tmpdir>
# type: "daily" or "monthly"
# tmpdir: name of dir or bucket
# return "true" or "false"
getfilelist()
{
    local tmpdir=$2
    local type=$1
    echo $(cd ${tmpdir}; ls backup_*_${type}_*.tgz)
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

SECONDSPERWEEK=$(( 60*60*24*7 ))
SECONDSPERYEAR=$(( 60*60*24*365 ))
TMPDIR=$1

NOW=$(date +"%s")
PATTERN='^backup.*_([0-9].*)\.tgz$'
DAILYFILELIST=$(getfilelist "daily" ${TMPDIR})
MONTHLYFILELIST=$(getfilelist "monthly" ${TMPDIR})
if [ "${DEBUG}" = "true" ]; then
    echo DAILYFILELIST: ${DAILYFILELIST}
    echo MONTHLYFILELIST: ${MONTHLYFILELIST}
fi

#First look for daily backups older than 7 days
PURGELIST=()
for value in ${DAILYFILELIST[@]}; do
    [[ $value =~ ${PATTERN} ]]
    timestamp=$(date +"%s" -d "${BASH_REMATCH[1]}")
    diff=$(( $NOW - $timestamp ));
    if [ "$diff" -gt ${SECONDSPERWEEK} ]; then
        PURGELIST+=(${BASH_REMATCH[0]})
    fi
done

if [ "${DEBUG}" = "true" ]; then
    echo Daily purge list ${PURGELIST[@]}
fi

# In case there is already a monthly backup for the month
# delete the daily, otherwise move the daily to monthly backup
for value in ${PURGELIST[@]}; do
    result=$(check_monthly $TMPDIR ${value})
    if [ -z "$result" ]; then
        if [ "${DEBUG}" = "true" ]; then
            echo rm $TMPDIR/${value}
        fi
        if [ ! "${DRYRUN}" = "true" ]; then
            rm $TMPDIR/${value}
        fi
    else
        if [ "${DEBUG}" = "true" ]; then
            echo mv $TMPDIR/${value} ${TMPDIR}/$result
        fi
        if [ ! "${DRYRUN}" = "true" ]; then
            mv $TMPDIR/${value} ${TMPDIR}/$result
        fi
    fi
done

# Search for montly backups older than one year
# and delete them
PURGELIST=()
for value in ${MONTHLYFILELIST[@]}; do
    [[ $value =~ ${PATTERN} ]]
    timestamp=$(date +"%s" -d "${BASH_REMATCH[1]}")
    diff=$(( $NOW - $timestamp ));
    if [ "$diff" -gt ${SECONDSPERYEAR} ]; then
        PURGELIST+=(${BASH_REMATCH[0]})
    fi
done

if [ "${DEBUG}" = "true" ]; then
    echo Monthly purge list ${PURGELIST[@]}
fi

# delete too old monthly backups
for value in ${PURGELIST[@]}; do
    if [ "${DEBUG}" = "true" ]; then
        echo rm $TMPDIR/${value}
    fi
    if [ ! "${DRYRUN}" = "true" ]; then
        rm $TMPDIR/${value}
    fi
done