printf "\033[1mStarting k3s\n"
printf -- "------------\033[0m\n"
pushd .
rm -rf ~/k3s
mkdir ~/k3s
# The server needs to run with --disable-agent, otherwise the containers will be distributed abount agent and server node.
# Then we'd need to copy the images to both nodes which takes more time with no benefit (because it all runs on a single node anyhow)
curl https://raw.githubusercontent.com/rancher/k3s/v1.17.13%2Bk3s1/docker-compose.yml | \
  sed 's/command: server/command: server --disable-agent/g' \
  > ~/k3s/docker-compose.yml
#Compose down is necessary for subsequent runs to succeed
export K3S_VERSION=v1.17.13-rc1-k3s1
export K3S_TOKEN="abcdefghijgklm123456789"
cd ~/k3s && sudo -E docker-compose down -v && sudo -E docker-compose up -d
printf "Waiting for k3s to create kubeconfig file\n"
while [ ! -f ~/k3s/kubeconfig.yaml ]
do
  sleep 1
done
if [ -f ~/.kube/config ]; then
   printf "Backing-up old config in ~/.kube/config_beforeoisp.bak\n"
   mv ~/.kube/config ~/.kube/config_beforeoisp.bak
fi
cp ~/k3s/kubeconfig.yaml ~/.kube/config

printf "\033[1mKubernetes cluster started\033[0m\n"
kubectl cluster-info
printf "\n"
printf "\033[1mGot storage classes:\033[0m\n"
kubectl get storageclass
printf "\n"

printf "\033[1mSet routing between docker and host for K3S\033[0m\n"
# Needed for Kafka testing and cert-Manager
AGENTID=$(docker ps | grep agent| awk '{print $1}')
AGENTIP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${AGENTID})
sudo route add -net 10.42.0.0 netmask 255.255.0.0 gw ${AGENTIP}
sudo route add -net 10.43.0.0 netmask 255.255.0.0 gw ${AGENTIP}

printf "\033[1mWaiting for traefik to come up\033[0m\n"
while [ -z "$(kubectl -n kube-system get pods -l=app=traefik --ignore-not-found)" ]; do
 printf "."; sleep 5;
done
while kubectl -n kube-system get pods -l=app=traefik -o jsonpath="{.items[*].status.containerStatuses[*].ready}" | grep false >> /dev/null; do
 printf "."; sleep 5;
done;
printf "\033[1m\nTraefik ready!\033[0m\n"

popd
./deploy_operators.sh

printf "\033[1mReady to deploy OISP\033[0m\n"
