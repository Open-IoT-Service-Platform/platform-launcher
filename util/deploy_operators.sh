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
printf "\033[1mInstalling minio operator\n"
printf -- "------------------------\033[0m\n"
printf "\n"
printf "\033[1mInstalling KREW\n"
printf -- "------------------------\033[0m\n"
(
  set -x; cd "$(mktemp -d)" &&
  OS="$(uname | tr '[:upper:]' '[:lower:]')" &&
  ARCH="$(uname -m | sed -e 's/x86_64/amd64/' -e 's/\(arm\)\(64\)\?.*/\1\2/' -e 's/aarch64$/arm64/')" &&
  KREW="krew-${OS}_${ARCH}" &&
  curl -fsSLO "https://github.com/kubernetes-sigs/krew/releases/latest/download/${KREW}.tar.gz" &&
  tar zxvf "${KREW}.tar.gz" &&
  ./"${KREW}" install krew
)
printf "\n"
printf "\033[1mInstalling MINIO operator via krew\n"
printf -- "------------------------\033[0m\n"
export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"
kubectl krew update
kubectl krew install minio
kubectl minio init

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
kubectl apply -f ../kubernetes/cert-manager/clusterissuer-self-cert.yaml

printf "\n"
printf "\033[1mInstalling cassandra operator\n"
printf -- "------------------------\033[0m\n"
kubectl create ns cassandra
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
kubectl create -f manifests/configmap.yaml  # configuration
kubectl create -f manifests/operator-service-account-rbac.yaml  # identiy and permissions
kubectl create -f manifests/postgres-operator.yaml  # deployment
kubectl create -f manifests/api-service.yaml  # operator API to be used by UI
cd ..
rm -rf postgres-operator
printf "\033[1mPostgres operator installed successfully.\033[0m\n"

printf -- "\033[1mOperators installed successfully.\033[0m\n"
