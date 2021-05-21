#!/bin/sh

echo "Database address is set to: $DB_ADDR"
echo "OISP Frontend User Account Endpoint is set to: $OISP_FRONTEND_USER_ACCOUNT_ENDPOINT"
echo "OISP Frontend Device Account Endpoint is set to: $OISP_FRONTEND_DEVICE_ACCOUNT_ENDPOINT"
echo "OISP Frontend User Delete Endpoint is set to: $OISP_FRONTEND_USER_DELETE_ENDPOINT"
REALM_DIR="/opt/jboss/keycloak/realms/oisp-realm.json"
# SECRET variables are already defined in the environment variables
sed -i "s/{{ INSERT-OISP-FRONTEND-SECRET }}/${OISP_FRONTEND_SECRET}/" ${REALM_DIR}
sed -i "s/{{ INSERT-MQTT-BROKER-SECRET }}/${OISP_MQTT_BROKER_SECRET}/" ${REALM_DIR}
sed -i "s/{{ INSERT-WEBSOCKET-SERVER-SECRET }}/${OISP_WEBSOCKET_SERVER_SECRET}/" ${REALM_DIR}
sed -i "s/{{ INSERT-FUSION-BACKEND-SECRET }}/${FUSION_BACKEND_SECRET}/" ${REALM_DIR}
