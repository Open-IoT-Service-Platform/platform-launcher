export SYSTEMUSER_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.mqtt-gateway  | jq -r .frontendSystemPassword)
export GRAFANA_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.grafana | jq -r .adminPassword)
export MQTT_BROKER_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.mqtt-broker | jq -r .mqttBrokerPassword)
export RULEENGINE_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.rule-engine | jq -r .password)
export RULEENGINE_GEARPUMP_PASSWORD=$( kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.rule-engine | jq -r .gearpumpPassword)
export WEBSOCKETSERVER_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.websocket-user | jq -r .password)
export POSTGRES_SU_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.postgres | jq -r .su_password)
export POSTGRES_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.postgres | jq -r .password)
export KEYCLOAK_PASSWORD=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.keycloak-admin | jq -r .password)
export KEYCLOAK_FRONTEND_SECRET=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.keycloak | jq -r .secret)
export KEYCLOAK_MQTT_BROKER_SECRET=$(kubectl -n ${NAMESPACE} get -o yaml configmaps oisp-config | shyaml get-value data.keycloak | jq -r .mqtt-broker-secret)
# tr "." "_" because jq cannot handle keys with "."
export JWT_PRIVATE=$(kubectl -n ${NAMESPACE} -o json get secret oisp-secrets | tr "." "_" | jq -r .data.jwt_privatekey)
export JWT_PUBLIC=$(kubectl -n ${NAMESPACE} -o json get secret oisp-secrets | tr "." "_" | jq -r .data.jwt_publickey)
export JWT_X509=$(kubectl -n ${NAMESPACE} -o json get secret oisp-secrets | tr "." "_" | jq -r .data.jwt_x509)

# Check whether SYSTEMUSER_PASSWORD is recovered to make sure the tools are installed
# and the namespace is valid
if [ -z $SYSTEMUSER_PASSWORD ]
then
    echo "Could not get credentials in namespace: ${NAMESPACE}. Make sure jq and shyaml are installed."
    exit 1
fi
