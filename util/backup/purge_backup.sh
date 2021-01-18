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
#DRYRUN=true # uncomment to avoid filesystem commands


# list files, for s3 or regular filesystem
# parameters: <backupdir> <pattern>
listfiles()
{
    local backupdir=$1
    local pattern=$2
    if [ "${DEBUG}" = "true" ]; then
        echo listfiles $backupdir and pattern "$pattern" >&2
    fi
    if [[ $backupdir == s3\:\/\/* ]]; then
        files=($(s3cmd ls "$backupdir" | awk '{print $4}'))
        result=()
        for value in "${files[@]}"; do
            strippedfile=${value#"$backupdir/"}
            if [[ $strippedfile == $pattern ]]; then
                result+=($strippedfile)
            fi
        done
        echo "${result[@]}"
    else
        echo $(cd $backupdir; ls $pattern 2>/dev/null)
    fi
}


# rm a file, for s3 or regular filesystem
# parameters: <file>
rmfile()
{
    local filename=$1
    if [ "${DEBUG}" = "true" ]; then
        echo rmfile $filename >&2
    fi
    if [[ $filename == s3\:\/\/* ]]; then
        s3cmd del $filename
    else
        rm $filename
    fi
}

# mv a file, for s3 or regular filesystem
# parameters: <file1> <file2>
mvfile()
{
    local filename1=$1
    local filename2=$2
    if [ "${DEBUG}" = "true" ]; then
        echo mvfile $filename1 $filename2 >&2
    fi
    if [[ $filename1 == s3\:\/\/* ]]; then
        s3cmd mv $filename1 $filename2
    else
        mv $filename1 $filename2
    fi
}

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
    if [ ! -z "$monthly_prefix" ] && [ -z "$(listfiles "$tmpdir" "$monthly_prefix*" 2>/dev/null)" ]; then
        echo $monthly
    fi
}


# return a filelist
# parameters: <type> <backupdir>
# type: "daily" or "monthly"
# backupdir: name of dir or bucket
getfilelist()
{
    local tmpdir=$2
    local type=$1
    if [ "${DEBUG}" = "true" ]; then
        echo getfilelist debug: $tmpdir -- $type >&2
    fi 
    echo $(listfiles ${tmpdir} "backup_*_${type}_*.tgz")
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
BACKUPDIR=$1

#listfiles $BACKUPDIR "*"

#exit 0
NOW=$(date +"%s")
PATTERN='^backup.*_([0-9].*)\.tgz$'
DAILYFILELIST=$(getfilelist "daily" ${BACKUPDIR})
MONTHLYFILELIST=$(getfilelist "monthly" ${BACKUPDIR})
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
    result=$(check_monthly $BACKUPDIR ${value})
    if [ -z "$result" ]; then
        if [ "${DEBUG}" = "true" ]; then
            echo rm $BACKUPDIR/${value}
        fi
        if [ ! "${DRYRUN}" = "true" ]; then
            echo Removing file $BACKUPDIR/${value}
            rmfile $BACKUPDIR/${value}
        fi
    else
        if [ "${DEBUG}" = "true" ]; then
            echo mv $BACKUPDIR/${value} ${BACKUPDIR}/$result
        fi
        if [ ! "${DRYRUN}" = "true" ]; then
            echo Renaming file $BACKUPDIR/${value} to ${BACKUPDIR}/$result
            mvfile $BACKUPDIR/${value} ${BACKUPDIR}/$result
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
        echo rm $BACKUPDIR/${value}
    fi
    if [ ! "${DRYRUN}" = "true" ]; then
        echo Removing file $BACKUPDIR/${value}
        rmfile $BACKUPDIR/${value}
    fi
done

