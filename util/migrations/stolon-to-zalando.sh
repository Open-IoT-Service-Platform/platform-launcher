#! /bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

STOLON_PODNAME="oisp-stolon-keeper-0"
STOLON_SERVICE="postgres"
ZALANDO_PODNAME="acid-oisp-0"
ZALANDO_SERVICE="acid-oisp"
ZALANDO_DBNAME="oisp"

ZALANDO_OISP_USER="oisp_user"
NAMESPACE="${NAMESPACE:-oisp}"

TMPDIR="/tmp/stolon-zalando-migration/"
echo "Migrating from ${STOLON_HOSTNAME} to ${ZALANDO_HOSTNAME}, dumping to: /tmp/${TMPDIR}"

# Dump Stolon DB to TMPDIR/database.sql
rm -rf ${TMPDIR}/database.sql
(export TMPDIR && export DBHOSTNAME=${STOLON_SERVICE} && export NAMESPACE=${NAMESPACE} && cd $DIR/../../ && make backup-db) || (echo "DB dumping from Stolon failed" && exit 1)
echo "Done dumping Stolon to ${TMPDIR}/database.sql"

(kubectl -n ${NAMESPACE} exec ${ZALANDO_PODNAME} -- psql -U superuser -l | grep "oisp" && echo "DB Oisp found") || \
    (echo "Creating db" && \
	 kubectl -n ${NAMESPACE} exec ${ZALANDO_PODNAME} -- psql -d postgres -U superuser -c "CREATE DATABASE oisp;" && \
	 kubectl -n ${NAMESPACE} exec ${ZALANDO_PODNAME} -- psql -d postgres -U superuser -c "ALTER DATABASE oisp OWNER TO ${ZALANDO_OISP_USER};")

echo "Database oisp exists, ready for migration"
(export TMPDIR && export DBHOSTNAME=${ZALANDO_SERVICE} && export NAMESPACE && cd $DIR/../../ && \
     make restore-db) || (echo "DB restoration failed" && exit 1)

echo "Found following users and maybe more (sanity check:)"
kubectl -n ${NAMESPACE} exec ${ZALANDO_PODNAME} -- psql -d oisp -U oisp_user -c "SELECT email FROM dashboard.users;" | tail

echo "Data migration successful, configuration can be updated to use Zalando from now on."
