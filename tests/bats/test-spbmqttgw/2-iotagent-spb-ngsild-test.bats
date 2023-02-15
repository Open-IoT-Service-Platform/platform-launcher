#!/usr/bin/env bats

if [ -z "${SELF_HOSTED_RUNNER}" ]; then
    SUDO="sudo -E"
fi
DEBUG=${DEBUG:-false} # set this to true to disable starting and stopping of kubefwd
SKIP= # set =skip to skip all test (and only remove $SKIP from the test you are interested in)
# shellcheck disable=SC2034
BATS_TEST_TIMEOUT=30 # Test timeout of 30 second
OISPNAMESPACE=oisp
IFFNAMESPACE=iff
EMQX_SERVICE=emqx
EMQX_NONSSL_PORT=1883
RANDOM=$$
USER=test${RANDOM}@test.com
TEST_PASSWORD=test123
PROPERTY_VALUE=${RANDOM}
RELATIONSHIP_VALUE=urn:filter:1
PROPERTY_NAME=Property/https://industry-fusion.com/types/v0.9/state
PROPERTY_NGSILD_NAME=https://industry-fusion.com/types/v0.9/state
RELATIONSHIP_NAME=Relationship/https://industry-fusion.com/types/v0.9/hasFilter
RELATIONSHIP_NGSILD_NAME=https://industry-fusion.com/types/v0.9/hasFilter
DEVICE_ID=urn:plasmacutter:1
KAFKA_NGSILD_TOPIC=$(kubectl -n oisp get cm oisp-config -o jsonpath='{.data.mqtt-gateway}'| jq '.ngsildTopic' | tr -d '"')
KAFKA_BOOTSTRAP=$(kubectl -n oisp get cm/oisp-config -o jsonpath='{.data.kafka}'| jq .uri| tr -d '"')
KAFKACAT_NGSILD=/tmp/KAFKACAT_NGSILD
KAFKACAT_ATTRIBUTES_FILTERED=/tmp/KAFKACAT_ATTRIBUTES_FILTERED
PROPERTY=https://uri.etsi.org/ngsi-ld/Property
RELATIONSHIP=https://uri.etsi.org/ngsi-ld/Relationship

cat << EOF > config.json
{
	"data_directory": "./data",
	"listeners": {
		"rest_port": 8000,
		"udp_port": 41234,
		"tcp_port": 7070
	},
	"receivers": {
		"udp_port": 41235,
		"udp_address": "127.0.0.1"
	},
	"logger": {
		"level": "info",
		"path": "/tmp/",
		"max_size": 134217728
	},
	"connector": {
		"rest": {
			"host": "frontend",
			"port": 4001,
			"protocol": "http",
			"strictSSL": false,
			"timeout": 30000,
			"proxy": {
				"host": false,
				"port": false
			}
		},
		"mqtt": {
			"host": "${EMQX_SERVICE}",
			"port": ${EMQX_NONSSL_PORT},
			"qos": 1,
			"retain": false,
			"secure": false,
			"retries": 5,
			"strictSSL": false,
			"sparkplugB": true,
			"version": "spBv1.0"          
		}
	}
}
EOF

cat << EOF > userlogin.json
{
    "username": "${USER}",
    "password": "${TEST_PASSWORD}"
}
EOF

# compare Property entity with reference
# $1: file to compare with
compare_ngsild_property_inkafka() {
    cat << EOF | jq -S | diff "$1" - >&3
	{
	"id": "${DEVICE_ID}\\\https://industry-fusion.com/types/v0.9/state",
	"entityId": "${DEVICE_ID}",
	"nodeType": "@value",
	"name": "${PROPERTY_NGSILD_NAME}",
	"type": "${PROPERTY}",
	"https://uri.etsi.org/ngsi-ld/hasValue": "${PROPERTY_VALUE}",
	"index": 0
}
EOF
}

# compare Relationship entity with reference
# $1: file to compare with
compare_ngsild_relationship_inkafka() {
    cat << EOF | jq -S | diff "$1" - >&3
	{
	"id": "${DEVICE_ID}\\\https://industry-fusion.com/types/v0.9/hasFilter",
	"entityId": "${DEVICE_ID}",
	"nodeType": "@id",
	"name": "${RELATIONSHIP_NGSILD_NAME}",
	"type": "${RELATIONSHIP}",
	"https://uri.etsi.org/ngsi-ld/hasObject": "${RELATIONSHIP_VALUE}",
	"index": 0
}
EOF
}

# Create User in Frontend
create_test_user() {
	FRONTEND_POD=$(kubectl -n oisp get pods| grep frontend| cut -f 1 -d " ")
	kubectl -n oisp exec -i "$FRONTEND_POD" -c frontend -- node /app/admin addUser $USER $TEST_PASSWORD
}

#check if frontend svc port is forwarded by kubefwd or not
check_frontend_fwd() {
	curl -Is http://frontend:4001 | head -1 | tr -d '"'
}
# Return: token
get_token() {
 	curl -vv -X POST http://frontend:4001/v1/api/auth/token -H "Content-Type: application/json" -d '@userlogin.json' 2>/dev/null| jq ".token"| tr -d '"'
 }

# Return: account id
create_account() {
	curl -X POST http://frontend:4001/v1/api/accounts -H "Authorization: Bearer $1" -H "Content-Type: application/json" -d '{"name":"test_account23"}' 2>/dev/null| jq ".activation_code"| tr -d '"' 
}

setup_file() {
	echo "# Downloading and installing IoT Agent v2.4.1 to do e2e spb test"
	#Adding labels to services
	kubectl -n oisp label svc frontend app.kubernetes.io/name=frontend --overwrite=true
	kubectl -n oisp label svc emqx app.kubernetes.io/name=emqx  --overwrite=true
	# shellcheck disable=SC2086
	[ $DEBUG = "true" ] || (exec ${SUDO} kubefwd  -n ${OISPNAMESPACE} -n ${IFFNAMESPACE} -l "app.kubernetes.io/name in (kafka, frontend, emqx)" svc) &
	echo "# launched kubefwd for oisp, wait some seconds to give kubefwd to launch the services"
	sleep 3

	if [ ! -e "./oisp-iot-agent" ]; then 
	echo "# Downloading IoT Agent"
	git clone https://github.com/Open-IoT-Service-Platform/oisp-iot-agent.git
	sleep 3
	else
	echo "# oisp-iot-agent file exist"
	fi
	
	while [ -z "$(check_frontend_fwd)" ]
	do
		echo "# Stil waiting for oisp svc kube forwarded"
		FRONTEND_UP=$(check_frontend_fwd)
		echo "# FRONTEND Curl reply: ${FRONTEND_UP}"
		sleep 1
	done

	echo "# create test user"
	create_test_user
	token=$(get_token)
	echo "# received_token: ${token}"
	account_activation_code="$(create_account "${token}")"
	echo "# Activating iot-agent device with activation code: $account_activation_code"
	echo "# Installing Iot Agent"
	cd oisp-iot-agent/ || exit
	git checkout v2.4.1
	npm install 
    sleep 5
	mv ../config.json ./config/config.json 
	./oisp-admin.js initialize
	./oisp-admin.js set-device-name ${DEVICE_ID}
	./oisp-admin.js set-device-id ${DEVICE_ID}
	./oisp-admin.js set-gateway-id ${DEVICE_ID}
	./oisp-admin.js activate "$account_activation_code"
	sleep 2
	
}

teardown_file() {
    echo "# now deleting iot-agent and kubefwd "
	cd - || return
    rm -rf oisp-iot-agent/ config.json userlogin.json
    # shellcheck disable=SC2086
	[ $DEBUG = "true" ] || ${SUDO} pkill -9 -f kubefwd
	sleep 2
	echo "#Remove label of pods"
	kubectl -n oisp label svc frontend app.kubernetes.io/name-
	kubectl -n oisp label svc emqx app.kubernetes.io/name-  
}

@test "Verify Iot Agent sending SpB-NGSILD Property message and kafka bridge receive in NGSI-LD format" {
    $SKIP
	bats_require_minimum_version 1.9.0
    echo "# Sending Device property data to Mqtt GW  in NGSILD-data format and checking at Kafka"
	# shellcheck disable=SC2086
	(exec stdbuf -oL kafkacat -C -t ${KAFKA_NGSILD_TOPIC} -b ${KAFKA_BOOTSTRAP} -o end >${KAFKACAT_NGSILD}) &
	./oisp-admin.js register ${PROPERTY_NAME} temperature.v1.0
	./oisp-admin.js observation ${PROPERTY_NAME} ${PROPERTY_VALUE}
	sleep 3
    killall kafkacat
	grep -v flush < ${KAFKACAT_NGSILD} |jq -S > ${KAFKACAT_ATTRIBUTES_FILTERED}
 	run compare_ngsild_property_inkafka ${KAFKACAT_ATTRIBUTES_FILTERED}
    [ "$status" -eq 0 ]
}

@test "Verify Iot Agent sending SpB-NGSILD Relationship message and kafka bridge receive in NGSI-LD format " {
    $SKIP
	bats_require_minimum_version 1.9.0
    echo "# Sending Device Relationship data to Mqtt GW  in NGSILD-data format and checking at Kafka"
	# shellcheck disable=SC2086
	(exec stdbuf -oL kafkacat -C -t ${KAFKA_NGSILD_TOPIC} -b ${KAFKA_BOOTSTRAP} -o end >${KAFKACAT_NGSILD}) &
	./oisp-admin.js register ${RELATIONSHIP_NAME} temperature.v1.0
	./oisp-admin.js observation ${RELATIONSHIP_NAME} ${RELATIONSHIP_VALUE}
	sleep 3
    killall kafkacat
	grep -v flush < ${KAFKACAT_NGSILD} |jq -S > ${KAFKACAT_ATTRIBUTES_FILTERED}
 	run compare_ngsild_relationship_inkafka ${KAFKACAT_ATTRIBUTES_FILTERED}
    [ "$status" -eq 0 ]
}