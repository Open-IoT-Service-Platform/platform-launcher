#printf "\033[1mStarting k3s\n"
#printf -- "------------\033[0m\n"
#rm -rf ~/k3s
#mkdir ~/k3s
#curl https://raw.githubusercontent.com/rancher/k3s/release/v1.0/docker-compose.yml > ~/k3s/docker-compose.yml
# Compose down is necessary for subsequent runs to succeed
#cd ~/k3s && sudo docker-compose down -v && sudo docker-compose up -d
#printf "Waiting for k3s to create kubeconfig file\n"
#while [ ! -f ~/k3s/kubeconfig.yaml ]
#do
#  sleep 1
#done
#if [ -f ~/.kube/config ]; then
#   printf "Backing-up old config in ~/.kube/config_beforeoisp.bak\n"
#   mv ~/.kube/config ~/.kube/config_beforeoisp.bak
#fi
#cp ~/k3s/kubeconfig.yaml ~/.kube/config
#
printf "\033[1mKubernetes cluster started\033[0m\n"
kubectl cluster-info
printf "\n"
printf "\033[1mGot storage classes:\033[0m\n"
kubectl get storageclass
printf "\n"

printf "\n"
printf "\033[1mInstalling k8s operators\n"
printf -- "------------------------\033[0m\n"
kubectl create -f https://github.com/minio/minio-operator/blob/master/minio-operator.yaml?raw=true --validate=false
helm repo add banzaicloud-stable https://kubernetes-charts.banzaicloud.com/
kubectl create ns kafka
helm install kafka-operator --namespace=kafka banzaicloud-stable/kafka-operator
kubectl create ns zookeeper
helm install zookeeper-operator --namespace=zookeeper banzaicloud-stable/zookeeper-operator
# Cassandra operator does not have helm chart yet
kubectl create ns cassandra
kubectl -n cassandra apply -f https://raw.githubusercontent.com/instaclustr/cassandra-operator/v3.1.1/deploy/crds.yaml
kubectl -n cassandra apply -f https://raw.githubusercontent.com/instaclustr/cassandra-operator/v3.1.1/deploy/bundle.yaml
kubectl -n cassandra delete cm cassandra-operator-default-config && \

printf -- "\033[1mOperators installed successfully.\033[0m\n"

printf "\033[1mReady to deploy OISP\033[0m\n"
