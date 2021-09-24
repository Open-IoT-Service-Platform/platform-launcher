#!/bin/bash

# IMPORTANT:
# This script requires that the import realm does not contain any users

REALM_DIR="/opt/jboss/keycloak/realms"
IMPORT_REALM="oisp-realm.json"
EXPORT_REALM="OISP-realm.json"
EXPORT_USERS="OISP-users-"
BACKUP_REALM="OISP-realm-backup.json"
REALM_NAME="OISP"
SUCCESS_MESSAGE="Admin console listening"
SLEEP_TIME=5
CURRENT_TIME=0
TIMEOUT=300

echo "Exporting current realm..."

/opt/jboss/keycloak/bin/standalone.sh -Dkeycloak.migration.action=export \
    -Dkeycloak.migration.provider=dir \
    -Dkeycloak.migration.dir=${REALM_DIR} \
    -Dkeycloak.migration.usersExportStrategy=DIFFERENT_FILES \
    -Dkeycloak.migration.usersPerFile=100 \
    -Djboss.http.port=6666 -Djboss.https.port=6667 \
    -Djboss.management.http.port=7776 -Djboss.management.https.port=7777 \
    -Dkeycloak.migration.realmName=OISP \
    -Dkeycloak.profile.feature.token_exchange=enabled \
    -Dkeycloak.profile.feature.admin_fine_grained_authz=enabled \
    -Dkeycloak.profile.feature.upload_scripts=enabled &> ${REALM_DIR}/export_logs &

while [[ -z $(cat ${REALM_DIR}/export_logs | grep "${SUCCESS_MESSAGE}" ${REALM_DIR}/export_logs) ]]; do
    echo "."
    CURRENT_TIME=$(expr ${CURRENT_TIME} + ${SLEEP_TIME})
    if [[ ${TIMEOUT} -lt ${CURRENT_TIME} ]]; then
        echo "Timeout occurred during export, dumping logs and exiting..."
        cat ${REALM_DIR}/export_logs
        kill %1
        exit 1
    fi
    sleep ${SLEEP_TIME}
done

CURRENT_TIME=0
kill %1 &> /dev/null

echo "Realm export successful!"

cp ${REALM_DIR}/${EXPORT_REALM} ${REALM_DIR}/${BACKUP_REALM}
cp ${REALM_DIR}/${IMPORT_REALM} ${REALM_DIR}/${EXPORT_REALM}

echo "Importing new realm..."

/opt/jboss/keycloak/bin/standalone.sh -Dkeycloak.migration.action=import \
    -Dkeycloak.migration.provider=dir \
    -Dkeycloak.migration.dir=${REALM_DIR} \
    -Dkeycloak.migration.usersExportStrategy=DIFFERENT_FILES \
    -Dkeycloak.migration.usersPerFile=100 \
    -Djboss.http.port=6668 -Djboss.https.port=6669 \
    -Djboss.management.http.port=7778 -Djboss.management.https.port=7779 \
    -Dkeycloak.migration.realmName=${REALM_NAME} \
    -Dkeycloak.migration.strategy=OVERWRITE_EXISTING \
    -Dkeycloak.profile.feature.token_exchange=enabled \
    -Dkeycloak.profile.feature.admin_fine_grained_authz=enabled \
    -Dkeycloak.profile.feature.upload_scripts=enabled &> ${REALM_DIR}/import_logs &

kill %1 &> /dev/null

while [[ -z $(cat ${REALM_DIR}/import_logs | grep "${SUCCESS_MESSAGE}" ${REALM_DIR}/import_logs) ]]; do
    echo "."
    CURRENT_TIME=$(expr ${CURRENT_TIME} + ${SLEEP_TIME})
    if [[ ${TIMEOUT} -lt ${CURRENT_TIME} ]]; then
        echo "Timeout occurred during import, dumping logs and exiting..."
        cat ${REALM_DIR}/import_logs
        kill %1
        exit 1
    fi
    sleep ${SLEEP_TIME}
done

rm ${REALM_DIR}/${EXPORT_USERS}*

echo "Realm import successful!"
