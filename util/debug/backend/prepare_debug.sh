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
kubectl -n ${NAMESPACE} delete deployment backend
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
echo recommended settings for kubeflow
echo kubectl -n oisp label svc oisp-kafka-headless app=kafka
echo sudo -E KUBECONFIG=~/k3s/kubeconfig.yaml kubefwd -n oisp svc -l "app in (kairosdb, kafka, minio)"
echo \#sudo ip route add 10.42.0.0/16 via \<ip of k3s-agent\> \# needed to use kafka, since kafka uses ip addresses rather domain names. kubefwd does not route ip addresses.
echo Make sure that backend is listening to port 8081\(\!\) not to 8080. Reason kubeforward is using localhost and thus cannot forward two 8080 ports \(and kairosdb uses 8080 as well\)
echo configure the backend:8081 in cm/oisp-config
popd
