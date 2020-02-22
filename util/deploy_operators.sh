printf "\n"
printf "\033[1mInstalling k8s operators\n"
printf -- "------------------------\033[0m\n"
kubectl create -f https://github.com/minio/minio-operator/blob/master/minio-operator.yaml?raw=true --validate=false
#helm repo add banzaicloud-stable https://kubernetes-charts.banzaicloud.com/
#kubectl create ns kafka
#helm install kafka-operator --namespace=kafka banzaicloud-stable/kafka-operator
#kubectl create ns zookeeper
#helm install zookeeper-operator --namespace=zookeeper banzaicloud-stable/zookeeper-operator
# Cassandra operator does not have helm chart yet
helm repo add incubator https://kubernetes-charts-incubator.storage.googleapis.com
kubectl create ns cassandra
kubectl -n cassandra apply -f https://raw.githubusercontent.com/instaclustr/cassandra-operator/v3.1.1/deploy/crds.yaml
kubectl -n cassandra apply -f https://raw.githubusercontent.com/instaclustr/cassandra-operator/v3.1.1/deploy/bundle.yaml
kubectl -n cassandra delete cm cassandra-operator-default-config && \

printf -- "\033[1mOperators installed successfully.\033[0m\n"
