#!/bin/bash

# Import images to local k3s cluster
K3S_NODE=$(docker ps --format '{{.Names}}' | grep k3s_node)
export DOCKER_TAG=test
for image in debugger hbase mqtt-gateway websocket-server frontend backend rule-engine opentsdb mqtt-broker grafana
do
    printf $image && \
    docker save oisp/$image:$DOCKER_TAG -o /tmp/$image && printf " is saved" && \
    docker cp /tmp/$image $K3S_NODE:/tmp/$image && printf ", copied" && \
    docker exec -it $K3S_NODE ctr image import /tmp/$image >> /dev/null && printf ", imported\n"
done;
