#!/bin/bash

git clone https://github.com/Open-IoT-Service-Platform/platform-launcher.git -b develop
cd platform-launcher
echo y | make update
helm init --upgrade --wait
if [[ $(helm ls -q | grep oisp) ]]; then
    CMD="upgrade"
    rm kubernetes/templates/jobs/db_setup.yaml
else
    CMD="deploy"
fi;
make ${CMD}-oisp DOCKER_TAG=nightly-$(date +"%Y-%m-%d")
