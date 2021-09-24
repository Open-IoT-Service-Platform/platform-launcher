#!/bin/bash

echo "Database address is set to: $DB_ADDR"
echo "OISP Frontend User Account Endpoint is set to: $OISP_FRONTEND_USER_ACCOUNT_ENDPOINT"
echo "OISP Frontend Device Account Endpoint is set to: $OISP_FRONTEND_DEVICE_ACCOUNT_ENDPOINT"
echo "OISP Frontend User Delete Endpoint is set to: $OISP_FRONTEND_USER_DELETE_ENDPOINT"
REALM_DIR="/opt/jboss/keycloak/realms"
SERVICE_ACCOUNTS=$(cat ${REALM_DIR}/service-accounts.json)

# SECRET variables are already defined in the environment variables
sed -i "s/{{ INSERT-OISP-FRONTEND-SECRET }}/${OISP_FRONTEND_SECRET}/" ${REALM_DIR}/oisp-realm.json
sed -i "s/{{ INSERT-MQTT-BROKER-SECRET }}/${OISP_MQTT_BROKER_SECRET}/" ${REALM_DIR}/oisp-realm.json
sed -i "s/{{ INSERT-WEBSOCKET-SERVER-SECRET }}/${OISP_WEBSOCKET_SERVER_SECRET}/" ${REALM_DIR}/oisp-realm.json
sed -i "s/{{ INSERT-FUSION-BACKEND-SECRET }}/${FUSION_BACKEND_SECRET}/" ${REALM_DIR}/oisp-realm.json


if [[ -n "${FORCE_MIGRATION}" ]]; then
  echo "FORCE_MIGRATION is set, running migration script..."
  sed -i "s/\"{{ INSERT-SERVICE-ACCOUNTS }}\"/\[\]/" ${REALM_DIR}/oisp-realm.json
  ${REALM_DIR}/migrate-realm.sh
else
  echo "FORCE_MIGRATION is not set, continuing..."
  sed -i "s/\"{{ INSERT-SERVICE-ACCOUNTS }}\"/${SERVICE_ACCOUNTS@Q}/" ${REALM_DIR}/oisp-realm.json
  # Fixing JSON syntax
  sed -i "s/\\$'\[/\[/" ${REALM_DIR}/oisp-realm.json
  sed -i "s/]'/]/" ${REALM_DIR}/oisp-realm.json
fi
