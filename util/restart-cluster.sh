#!/bin/bash

SCRIPTDIR=$(dirname "$0")
CLUSTERNAME=${CLUSTERNAME:-oispcluster}

if [ -z "$K3S_IMAGE" ]
then
	>&2 echo "ERROR: Image version must be specified in K3S_IMAGE env variable or the script must be called from the Makefile" && exit 1;
fi

k3d cluster delete ${CLUSTERNAME} || echo "Cluster ${CLUSTERNAME} could not be deleted/ does not exist"
k3d cluster create ${CLUSTERNAME} --registry-use k3d-oisp.localhost:12345 --image=${K3S_IMAGE}

printf "\033[1mKubernetes cluster started\033[0m\n"
kubectl cluster-info

# printf "\033[1mSet routing between docker and host for K3S\033[0m\n"
## Needed for Kafka testing and cert-Manager
# AGENTID=$(docker ps | grep "k3d-${CLUSTERNAME}-server-0" | awk '{print $1}')
## TODO check if agentid is there! It sometimes skips with docker inspect takes at least 1 arg.
# AGENTIP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${AGENTID})
# sudo route add -net 10.42.0.0 netmask 255.255.0.0 gw ${AGENTIP}
# sudo route add -net 10.43.0.0 netmask 255.255.0.0 gw ${AGENTIP}

printf "\033[1mWaiting for traefik to come up\033[0m\n"
while [ -z "$(kubectl -n kube-system get pods -l=app=traefik --ignore-not-found)" ]; do
 printf "."; sleep 5;
done
while kubectl -n kube-system get pods -l=app=traefik -o jsonpath="{.items[*].status.containerStatuses[*].ready}" | grep false >> /dev/null; do
 printf "."; sleep 5;
done;
printf "\033[1m\nTraefik ready!\033[0m\n"


./${SCRIPTDIR}/deploy_operators.sh
printf "\033[1mReady to deploy OISP\033[0m\n"
