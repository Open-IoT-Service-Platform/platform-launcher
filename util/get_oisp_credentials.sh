export SYSTEMUSER_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.mqtt-gateway  | jq -r .frontendSystemPassword)
export GRAFANA_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.grafana | jq -r .adminPassword)
export MQTT_BROKER_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.mqtt-broker | jq -r .mqttBrokerPassword)
export RULEENGINE_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.rule-engine | jq -r .password)
export RULEENGINE_GEARPUMP_PASSWORD=$( kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.rule-engine | jq -r .gearpumpPassword)
export WEBSOCKETSERVER_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.websocket-user | jq -r .password)
export POSTGRES_SU_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.postgres | jq -r .su_password)
export POSTGRES_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.postgres | jq -r .password)
# Check whether SYSTEMUSER_PASSWORD is recovered to make sure the tools are installed
# and the namespace is valid
if [ -z $SYSTEMUSER_PASSWORD ]
then
    echo "Could not get credentials in namespace: ${NAMESPACE}. Make sure jq and shyaml are installed."
    exit 1
fi
