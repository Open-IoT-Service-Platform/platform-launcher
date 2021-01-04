# Should be called from backend directory, e.g. ..../platform-launcher/oisp-frontend
pushd .
cd ../../util/debug/frontend
NAMESPACE=oisp
TARGETDIR=../../../oisp-frontend/public-interface
echo Namespace: ${NAMESPACE}

if [ ! ${#BASH_SOURCE[@]} -eq 1 ]; then
    echo script should be sourced to prepare environment!
    exit 1;
fi

# Find frontend instance. Assumes that only one instance exists
FRONTEND=$(kubectl -n ${NAMESPACE} get pods| grep frontend| cut -d " " -f 1)
echo frontend: $FRONTEND
# Source environment
source <(../../get_oisp_container_config.sh ${NAMESPACE} $FRONTEND)

# Copy keys
kubectl -n ${NAMESPACE} cp ${FRONTEND}:/app/keys/..data/private.pem ${TARGETDIR}/keys/private.pem
kubectl -n ${NAMESPACE} cp ${FRONTEND}:/app/keys/..data/public.pem ${TARGETDIR}/keys/public.pem
export NODE_ENV=locals

##########################
# Replace frontend Service
# create headless service
##########################
IPADDRESS=$(hostname -I | cut -d " " -f 1)
echo selected IP address ${IPADDRESS}
#kubectl -n ${NAMESPACE} delete deployment frontend
kubectl -n ${NAMESPACE} delete svc frontend
kubectl -n ${NAMESPACE} label svc keycloak-http app=keycloak
cat << EOF | kubectl -n ${NAMESPACE} create -f -
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: ${NAMESPACE}
spec:
  clusterIP: None
  ports:
  - protocol: TCP
    port: 4001
    targetPort: 4001
    name: "4001"
  - protocol: TCP
    port: 4002
    targetPort: 4002
    name: "4002"
  - protocol: TCP
    port: 4003
    targetPort: 4003
    name: "4003"
  - protocol: TCP
    port: 4004
    targetPort: 4004
    name: "4004"
---
apiVersion: v1
kind: Endpoints
metadata:
  name: frontend
  namespace: ${NAMESPACE}
subsets:
- addresses:
  - ip: ${IPADDRESS}
  ports:
  - port: 4001
    name: "4001"
  - port: 4002
    name: "4002"
  - port: 4003
    name: "4003"
  - port: 4004
    name: "4004"
EOF
(cd ${TARGETDIR}; npm install)
echo all prepared go to ${TARGETDIR} and start application
kubectl -n oisp label svc oisp-kafka-headless app=kafka
echo recommended settings for kubeflow
echo sudo -E KUBECONFIG=~/k3s/kubeconfig.yaml kubefwd -n oisp svc -l \""app in (backend, kafka, websocket-server, oisp-stolon-proxy, keycloak, redis, grafana, oisp-stolon-keeper)"\"
echo For routing kafka messages between k3s-agent and host:
echo sudo ip route add 10.42.0.0/16 via \<ip of k3s-agent\> \# needed to use kafka, since kafka uses ip addresses rather domain names. kubefwd does not route ip addresses.
popd
