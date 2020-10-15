#!/bin/sh

echo "Database address is set to: $DB_ADDR"
echo "OISP Frontend User Account Endpoint is set to: $OISP_FRONTEND_USER_ACCOUNT_ENDPOINT"
echo "OISP Frontend Device Account Endpoint is set to: $OISP_FRONTEND_DEVICE_ACCOUNT_ENDPOINT"
echo "OISP Frontend User Delete Endpoint is set to: $OISP_FRONTEND_USER_DELETE_ENDPOINT"
REALM_DIR="/opt/jboss/keycloak/realms/oisp-realm.json"
PRIVATE_KEY=$(cat /keys/private.pem)
PRIVATE_KEY=${PRIVATE_KEY//$'\n'/\\\\n}
PRIVATE_KEY=${PRIVATE_KEY//\//\\\/}
PUBLIC_CERT=$(cat /keys/x509.pem)
PUBLIC_CERT=${PUBLIC_CERT//$'\n'/\\\\n}
PUBLIC_CERT=${PUBLIC_CERT//\//\\\/}
sed -i "s/{{ INSERT-PRIVATE-KEY }}/${PRIVATE_KEY}/" ${REALM_DIR}
sed -i "s/{{ INSERT-PUBLIC-CERT }}/${PUBLIC_CERT}/" ${REALM_DIR}
# SECRET variables are already defined in the environment variables
sed -i "s/{{ INSERT-OISP-FRONTEND-SECRET }}/${OISP_FRONTEND_SECRET}/" ${REALM_DIR}
sed -i "s/{{ INSERT-MQTT-BROKER-SECRET }}/${OISP_MQTT_BROKER_SECRET}/" ${REALM_DIR}
sed -i "s/{{ INSERT-WEBSOCKET-SERVER-SECRET }}/${OISP_WEBSOCKET_SERVER_SECRET}/" ${REALM_DIR}
sed -i "s/{{ INSERT-FUSION-BACKEND-SECRET }}/${FUSION_BACKEND_SECRET}/" ${REALM_DIR}
