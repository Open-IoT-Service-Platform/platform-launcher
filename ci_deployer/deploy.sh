#!/bin/bash

git clone https://github.com/Open-IoT-Service-Platform/platform-launcher.git -b develop
cd platform-launcher
echo y | make update
export DOCKERUSER=${DOCKER_USERNAME}
export DOCKERPASS=${DOCKER_PASSWORD}
export NODOCKERLOGIN=true
export DOCKER_PREFIX=oisp
(while true; do sleep 60 && echo "This message prevents CI timeout"; done) & (make upgrade-oisp DOCKER_TAG=nightly-$(date +"%Y-%m-%d") NOBACKUP=true)
