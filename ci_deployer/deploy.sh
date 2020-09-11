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
export HELM_ARGS="--force --set less_resources=\"false\" --set production=\"true\" \
		--set certmanager.secret="frontend-web-prod-tls" \
                --set certmanager.issuer="letsencrypt-prod" \
                --set numberReplicas.frontend=2 \
                --set numberReplicas.backend=3"
make ${CMD}-oisp DOCKER_TAG=nightly-$(date +"%Y-%m-%d")
