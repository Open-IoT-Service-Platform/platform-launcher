# Should be called from rule-engine directory, e.g. ..../platform-launcher/oisp-beam-rule-engine
pushd .
cd ../util/debug/rule-engine
NAMESPACE=oisp
echo Namespace: ${NAMESPACE}

if [ ! ${#BASH_SOURCE[@]} -eq 1 ]; then
    echo script should be sourced to prepare environment!
    exit 1;
fi

# Find rule-engine instance. Assumes that only one instance exists
RULE_ENGINE=$(kubectl -n ${NAMESPACE} get pods| grep rule-engine| cut -d " " -f 1)
echo rule-engine: ${RULE_ENGINE}
# Source environment
source <(../../get_oisp_container_config.sh ${NAMESPACE} ${RULE_ENGINE})

##########################
# Replace rule-engine Service
# create headless service
##########################
IPADDRESS=$(hostname -I | cut -d " " -f 1)
echo selected IP address ${IPADDRESS}
kubectl -n ${NAMESPACE} delete svc rule-engine
cat << EOF | kubectl -n ${NAMESPACE} create -f -
apiVersion: v1
kind: Service
metadata:
  name: rule-engine
  namespace: ${NAMESPACE}
spec:
  clusterIP: None
  ports:
  - protocol: TCP
    port: 8090
    targetPort: 8090
    name: "8090"
---
apiVersion: v1
kind: Endpoints
metadata:
  name: rule-engine
  namespace: ${NAMESPACE}
subsets:
- addresses:
  - ip: ${IPADDRESS}
  ports:
  - port: 8090
    name: "8090"
EOF
echo all prepared
popd
