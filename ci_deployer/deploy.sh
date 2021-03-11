#!/bin/bash

git clone https://github.com/Open-IoT-Service-Platform/platform-launcher.git -b develop
cd platform-launcher
echo y | make update
export DOCKERUSER=${DOCKER_USERNAME}
export DOCKERPASS=${DOCKER_PASSWORD}
export NODOCKERLOGIN=true
if [[ $(helm ls -q --all-namespaces | grep "${NAME}\$") ]]; then
    CMD="upgrade"
    rm kubernetes/templates/jobs/db_setup.yaml
else
    CMD="deploy"
fi;
export DOCKER_PREFIX=oisp
make ${CMD}-oisp DOCKER_TAG=nightly-$(date +"%Y-%m-%d") NOBACKUP=true
