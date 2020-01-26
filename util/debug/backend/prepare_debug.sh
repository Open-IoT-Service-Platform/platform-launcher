# Should be called from backend directory, e.g. ..../platform-launcher/oisp-backend
pushd .
cd ../util/debug/backend
NAMESPACE=oisp
echo Namespace: ${NAMESPACE}

if [ ! ${#BASH_SOURCE[@]} -eq 1 ]; then
    echo script should be sourced to prepare environment!
    exit 1;
fi

# Find backend instance. Assumes that only one instance exists
BACKEND=$(kubectl -n ${NAMESPACE} get pods| grep backend| cut -d " " -f 1)
echo frontend: $FRONTEND
# Source environment
source <(../../get_oisp_container_config.sh ${NAMESPACE} ${BACKEND})

##########################
# Replace backend Service
# create headless service
##########################
IPADDRESS=$(hostname -I | cut -d " " -f 1)
echo selected IP address ${IPADDRESS}
kubectl -n ${NAMESPACE} delete svc backend
cat << EOF | kubectl -n ${NAMESPACE} create -f -
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: ${NAMESPACE}
spec:
  clusterIP: None
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 8080
    name: "8080"
---
apiVersion: v1
kind: Endpoints
metadata:
  name: backend
  namespace: ${NAMESPACE}
subsets:
- addresses:
  - ip: ${IPADDRESS}
  ports:
  - port: 8080
    name: "8080"
EOF
echo all prepared
popd
