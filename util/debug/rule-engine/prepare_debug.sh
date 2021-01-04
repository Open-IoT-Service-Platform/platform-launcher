# Should be called from rule-engine directory, e.g. ..../platform-launcher/oisp-beam-rule-engine
pushd .
cd ../util/debug/rule-engine
NAMESPACE=oisp
echo Namespace: ${NAMESPACE}

if [ ! ${#BASH_SOURCE[@]} -eq 1 ]; then
    echo script should be sourced to prepare environment!
    exit 1;
fi

# Find App config line of rule-engine service
JOBMANAGER=$(kubectl -n oisp get pods | grep flink-jobmanager| cut -d " " -f 1)
ARGS=$(kubectl -n oisp logs $JOBMANAGER | grep JSONConfig | tail -1)
if [ ! -z "$ARGS" ]; then
  echo Args of rule-engine:
  echo $ARGS

  #shutdown existing rule-engine service
  kubectl -n oisp delete bs/rule-engine
  echo all prepared
  echo sudo -E KUBECONFIG=~/k3s/kubeconfig.yaml kubefwd -n oisp svc
  echo \#sudo ip route add 10.42.0.0/16 via \<ip of k3s-agent\> \# needed to use kafka, since kafka uses ip addresses rather domain names. kubefwd does not route ip addresses.
else
  echo rule-engine not yet ready - try again after 1 minutes
fi

popd
