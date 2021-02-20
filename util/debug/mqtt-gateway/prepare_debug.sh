# Should be called from backend directory, e.g. ..../platform-launcher/oisp-backend
pushd .
cd ../util/debug/mqtt-server
NAMESPACE=oisp
echo Namespace: ${NAMESPACE}

if [ ! ${#BASH_SOURCE[@]} -eq 1 ]; then
    echo script should be sourced to prepare environment!
    exit 1;
fi

# Find backend instance. Assumes that only one instance exists
MQTTGW=$(kubectl -n ${NAMESPACE} get pods| grep mqtt-gateway| cut -d " " -f 1)
# Source environment
#kubectl -n ${NAMESPACE} exec ${POD_NAME} -- /bin/bash -c "export -p"
source <( kubectl -n ${NAMESPACE} exec ${MQTTGW} -- /bin/bash -c "export -p"  | grep -v "HOME\|PWD\|OLDPWD\|TERM\|PATH\|HOSTNAME")
##########################
# Replace backend Service
# create headless service
##########################
IPADDRESS=$(hostname -I | cut -d " " -f 1)
echo selected IP address ${IPADDRESS}
kubectl -n ${NAMESPACE} delete svc mqtt-gateway
cat << EOF | kubectl -n ${NAMESPACE} create -f -
apiVersion: v1
kind: Service
metadata:
  name: mqtt-gateway
  namespace: ${NAMESPACE}
spec:
  clusterIP: None
  ports:
  - protocol: TCP
    port: 3025
    targetPort: 3025
    name: "3025"
---
apiVersion: v1
kind: Endpoints
metadata:
  name: mqtt-gateway
  namespace: ${NAMESPACE}
subsets:
- addresses:
  - ip: ${IPADDRESS}
  ports:
  - port: 3025
    name: "3025"
EOF

popd
kubectl -n oisp label svc oisp-kafka-headless app=kafka
kubectl -n oisp label svc keycloak-headless keycloak-http app=keycloak
kubectl -n oisp label svc emqx app=emqx
echo recommended settings for kubeflow
echo sudo -E KUBECONFIG=~/k3s/kubeconfig.yaml kubefwd -n oisp svc -l \""app in (kafka, oisp-stolon-proxy, keycloak, redis, oisp-stolon-keeper, emqx)"\"
echo all prepared
echo call app with NODE_ENV=local node ./app.js
