#! /bin/bash

cmdname=$(basename $0)

usage()
{
    cat << USAGE >&2

Gets the environment variables of a running oisp container in kubernetes.
These variables can be exported like this:

source <(./$cmdname namespace containername)

Usage:

    $cmdname  [namespace] [containername] [blacklist]

    namespace : namespace of the running kubernetes cluster
    containername : name of the container that is running in the cluster
    blacklist : list of variables seperated by a space to exclude from the result
USAGE
    exit 1
}

if [ $# -eq 0 ] || [ $1 == "-h" ] ;
then
    usage
fi

NAMESPACE=$1
CONTAINER_NAME=$2
POD_NAME=$(kubectl -n ${NAMESPACE} get pods | grep ${CONTAINER_NAME} | cut -f 1 -d " ")
BLACKLISTED_VARS="HOME\|PWD\|OLDPWD\|TERM\|PATH\|HOSTNAME"

while [[ $# -gt 2 ]]
do
    BLACKLISTED_VARS="${BLACKLISTED_VARS}\|$3"
    shift
done

kubectl -n ${NAMESPACE} exec ${POD_NAME} -- /bin/bash -c "export -p" | grep -v ${BLACKLISTED_VARS}
