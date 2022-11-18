#!/bin/bash
set -e

printf "\n"
printf "\033[1mInstalling k8s operators\n"
printf -- "------------------------\033[0m\n"

helm repo add incubator https://charts.helm.sh/incubator
helm repo add stable https://charts.helm.sh/stable
helm repo add k8ssandra https://helm.k8ssandra.io/stable
helm repo update

## install CRDs for services operator - operator will be installed later by helm
printf "\n"
printf "\033[1mInstalling custom resource definitions for the services operator\n"
printf -- "------------------------\033[0m\n"
kubectl apply -f https://raw.githubusercontent.com/wagmarcel/oisp-services/beam-operator-rebase-from-digital-twin/services-operator/kubernetes/crd.yml
printf "\033[1mCustom resource definitions for the services operator installed successfully.\033[0m\n"

printf "\n"
printf "\033[1mInstalling cert-manager\n"
printf -- "------------------------\033[0m\n"
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.7.1/cert-manager.yaml
printf "\033[1mWaiting for cert-manager web-hook to come up\033[0m\n"
while [ -z "$(kubectl -n cert-manager get pods -l=app=webhook --ignore-not-found)" ]; do
  printf "."; sleep 5;
done
while kubectl -n cert-manager get pods -l=app=webhook -o jsonpath="{.items[*].status.containerStatuses[*].ready}" | grep false >> /dev/null; do
  printf "."; sleep 5;
done;
printf "\033[1m\nCert-manager Webhook ready! Now applying clusterissuer for self-cert.\033[0m\n"
if [ -f ../kubernetes/cert-manager/clusterissuer-self-cert.yaml ]; then
  kubectl apply -f ../kubernetes/cert-manager/clusterissuer-self-cert.yaml
fi

printf "\n"
printf "\033[1mInstalling cassandra operator\n"
printf -- "------------------------\033[0m\n"
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: cassandra
EOF

kubectl apply --force-conflicts --server-side -k github.com/k8ssandra/cass-operator/config/deployments/cluster?ref=v1.11.0
printf "\033[1mCassandra operator installed successfully.\033[0m\n"

printf "\n"
printf "\033[1mInstalling Zalando postgres-operator\n"
printf -- "------------------------\033[0m\n"
# First, clone the repository and change to the directory
git clone https://github.com/zalando/postgres-operator.git
cd postgres-operator
git checkout v1.7.0
kubectl apply -f manifests/postgresql.crd.yaml
kubectl apply -f manifests/configmap.yaml  # configuration
kubectl apply -f manifests/operator-service-account-rbac.yaml  # identiy and permissions
kubectl apply -f manifests/postgres-operator.yaml  # deployment
kubectl apply -f manifests/api-service.yaml  # operator API to be used by UI
cd ..
rm -rf postgres-operator
printf "\033[1mPostgres operator installed successfully.\033[0m\n"

printf -- "\033[1mOperators installed successfully.\033[0m\n"
