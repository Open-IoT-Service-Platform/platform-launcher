#! /bin/bash

BRANCH=${BRANCH:-develop}
K3S_NODE=$(docker ps --format '{{.Names}}' | grep k3s_node)
export TEST=1
export DOCKER_TAG=test

cd /tmp
rm -rf platform-launcher/
git clone https://github.com/Open-IoT-Service-Platform/platform-launcher.git -b $BRANCH
cd platform-launcher
git submodule update
make update
printf "n\ny\ny\n" | make build DEBUG=true

for image in debugger hbase mqtt-gateway websocket-server frontend backend rule-engine opentsdb mqtt-broker grafana
do
    printf $image && \
    docker save oisp/$image:$DOCKER_TAG -o $image && printf " is saved" && \
    docker cp $image $K3S_NODE:/tmp/$image && printf ", copied" && \
    docker exec -it $K3S_NODE ctr image import /tmp/$image >> /dev/null && printf ", imported\n"
done;
