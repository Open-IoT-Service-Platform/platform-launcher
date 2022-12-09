#!/usr/bin/env bats

if [ -z "${SELF_HOSTED_RUNNER}" ]; then
    SUDO="sudo -E"
fi
DEBUG=${DEBUG:-false} # set this to true to disable starting and stopping of kubefwd
SKIP= # set =skip to skip all test (and only remove $SKIP from the test you are interested in)
OISPNAMESPACE=oisp
IFFNAMESPACE=iff
KAIROSDB_SERVICE=$(kubectl -n oisp -l app=kairosdb get services -o jsonpath='{.items[0].metadata.name}')
KAIROSDB_PORT=$(kubectl -n oisp -l app=kairosdb get services -o jsonpath='{.items[0].spec.ports[0].port}')
KAIROSDB_URL=${KAIROSDB_SERVICE}.${OISPNAMESPACE}:${KAIROSDB_PORT}
KAIROSDB_PATH_GET_DATAPOINTS=/api/v1/datapoints/query
ATTRIBUTES_PROPERTY=/tmp/property.txt
ATTRIBUTES_PROPERTY2=/tmp/property2.txt
ATTRIBUTES_RELATIONSHIP=/tmp/relationship.txt
KAIROSDB_METRICS=/tmp/metrics
KAIROSDB_METRICS_RELATIONSHIP=/tmp/metrics_relationship
ATTRIBUTES_TOPIC=iff.ngsild.attributes
KAFKA_BOOTSTRAP=$(kubectl -n oisp get cm/oisp-config -o jsonpath='{.data.kafka}'| jq .uri| tr -d '"')
URN=urn:iff:serialnr:1
URN2=urn:iff:serialnr:2
STATE=https://industry-fusion.com/types/v0.9/state
REL=https://industry-fusion.com/types/v0.9/relationship
IDSTATE="${URN}\\\\${STATE}"
IDREL="${URN}\\\\${REL}"
VALUE="state"
VALUE2="1"
PROPERTY=https://uri.etsi.org/ngsi-ld/Property
RELATIONSHIP=https://uri.etsi.org/ngsi-ld/Relationship

cat << EOF > ${ATTRIBUTES_PROPERTY}
{
    "id": "${IDSTATE}",
    "entityId": "${URN}",
    "name": "${STATE}",
    "type": "${PROPERTY}",
    "https://uri.etsi.org/ngsi-ld/hasValue": "${VALUE}",
    "nodeType": "@id",
    "index": 0
}
EOF

cat << EOF > ${ATTRIBUTES_PROPERTY2}
{
    "id": "${IDSTATE}",
    "entityId": "${URN}",
    "name": "${STATE}",
    "type": "${PROPERTY}",
    "https://uri.etsi.org/ngsi-ld/hasValue": "${VALUE2}",
    "nodeType": "@value",
    "valueType": "http://www.w3.org/2001/XMLSchema#string",
    "index": 0
}
EOF

cat << EOF > ${ATTRIBUTES_RELATIONSHIP}
{
    "id": "${IDREL}",
    "entityId": "${URN}",
    "name": "${REL}",
    "type": "${RELATIONSHIP}",
    "https://uri.etsi.org/ngsi-ld/hasObject": "${URN2}",
    "nodeType": "@id",
    "index": 0
}
EOF

cat << EOF > ${KAIROSDB_METRICS}
{
    "start_relative": {
        "value": 5,
        "unit": "seconds"
    },
    "metrics": [
        {
            "name": "default\\\\${IDSTATE}",
            "limit": 10
        }
    ]
}
EOF

cat << EOF > ${KAIROSDB_METRICS_RELATIONSHIP}
{
    "start_relative": {
        "value": 5,
        "unit": "seconds"
    },
    "metrics": [
        {
            "name": "default\\\\${IDREL}",
            "limit": 10
        }
    ]
}
EOF

# send data to kafka bridge
# $1: file to send
# $2: kafka topic
send_to_kafka_bridge() {
    tr -d '\n' <"$1" | kafkacat -P -t "$2" -b "${KAFKA_BOOTSTRAP}"
}

# receive datapoints
# $1: payload to post
get_datapoints() {
    curl -vv -X POST "${KAIROSDB_URL}${KAIROSDB_PATH_GET_DATAPOINTS}" -d @"$1" 
}


# check sample[0]
# $1: object
# $2: expected sample_size
# $3: expected name
# $4: expected value
# $5: expected type
# $6: expected nodeType
check_sample_size() {
    echo "# Check_sample_size with $1 $2 $3 $4 $5"
    sample_size=$(echo "$1" | jq '.queries[0].sample_size' | tr -d '"')
    [ "$sample_size" = "$2" ] || { echo "# wrong value for field $2: $sample_size!=$2"; return 1; }
    name=$(echo "$1" | jq '.queries[0].results[0].name' | tr -d '"')
    [ "$name" = "$3" ] || { echo "# wrong value for field $3: $name!=$3"; return 1; }
    value=$(echo "$1" | jq '.queries[0].results[0].values[0][1]' | tr -d '"')
    [ "$value" = "$4" ] || { echo "# wrong value for field $4: $value!=$4"; return 1; }
    type=$(echo "$1" | jq '.queries[0].results[0].tags.type[0]' | tr -d '"')
    [ "$type" = "$5" ] || { echo "# wrong value for field $5: $type!=$5"; return 1; }
    nodeType=$(echo "$1" | jq '.queries[0].results[0].tags.nodeType[0]' | tr -d '"')
    [ "$nodeType" = "$6" ] || { echo "# wrong value for field $6: $nodeType!=$6"; return 1; }
    return 0
    
}

setup() {
    kubectl -n oisp label svc -l "app=kairosdb" app.kubernetes.io/name=kairosdb --overwrite=true
    # shellcheck disable=SC2086
    [ $DEBUG = "true" ] || (exec ${SUDO} kubefwd -n ${IFFNAMESPACE} -n ${OISPNAMESPACE} -l "app.kubernetes.io/name in (kafka, kairosdb)" svc) &
    echo "# launched kubefwd for kafka, wait some seconds to give kubefwd to launch the services"
    sleep 3
}
teardown(){
    echo "# now killing kubefwd"
    # shellcheck disable=SC2086
    [ $DEBUG = "true" ] || ${SUDO} killall kubefwd
}

@test "verify kairosdb-bridge is forwarding iri Property" {
    $SKIP
    echo "# Sending property to Kafka"
    send_to_kafka_bridge ${ATTRIBUTES_PROPERTY} ${ATTRIBUTES_TOPIC}
    sleep 2
    data=$(get_datapoints "${KAIROSDB_METRICS}")
    echo "# result: $data"
    echo "# Now checking result."
    run check_sample_size "$data" "1" "default\\\\$IDSTATE" "$VALUE" "$PROPERTY" "@id"
    [ "$status" -eq "0" ] || (echo -n "$output"; false)
}

@test "verify kairosdb-bridge is forwarding Relationship" {
    $SKIP
    echo "# Sending relationship to Kafka"
    send_to_kafka_bridge ${ATTRIBUTES_RELATIONSHIP} ${ATTRIBUTES_TOPIC}
    sleep 2
    data=$(get_datapoints "${KAIROSDB_METRICS_RELATIONSHIP}")
    echo "# result: $data"
    echo "# Now checking result."
    run check_sample_size "$data" "1" "default\\\\$IDREL" "$URN2" "$RELATIONSHIP" "@id"
    [ "$status" -eq "0" ] || (echo -n "$output"; false)
}

@test "verify kairosdb-bridge is forwarding value Property" {
    $SKIP
    echo "# Sending property to Kafka"
    send_to_kafka_bridge ${ATTRIBUTES_PROPERTY2} ${ATTRIBUTES_TOPIC}
    sleep 2
    data=$(get_datapoints "${KAIROSDB_METRICS}")
    echo "# result: $data"
    echo "# Now checking result."
    run check_sample_size "$data" "1" "default\\\\$IDSTATE" "$VALUE2" "$PROPERTY" "@value"
    [ "$status" -eq "0" ] || (echo -n "$output"; false)
}