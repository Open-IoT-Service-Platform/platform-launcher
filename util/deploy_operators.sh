#!/bin/bash
set -e

printf "\n"
printf "\033[1mInstalling k8s operators\n"
printf -- "------------------------\033[0m\n"

helm repo add incubator https://charts.helm.sh/incubator
helm repo add stable https://charts.helm.sh/stable
helm repo add k8ssandra https://helm.k8ssandra.io/stable
helm repo update

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

printf -- "\033[1mOperators installed successfully.\033[0m\n"
