#
# Copyright (c) 2017 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.



#----------------------------------------------------------------------------------------------------------------------
# targets
#----------------------------------------------------------------------------------------------------------------------

SHELL:=/bin/bash
CURRENT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
BRANCH:=$(shell git branch| grep \*| cut -d ' ' -f2)
export TEST = 0
export HOST_IP_ADDRESS=$(shell ip -4 addr show docker0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
SSL_CERT_PATH:=data/keys/ssl

COMPOSE_PROJECT_NAME?="oisp"
DOCKER_REGISTRY=""
CONTAINERS?=$(shell docker-compose --log-level ERROR config --services)
DOCKER_COMPOSE_ARGS?=
PULL_IMAGES?=false
DEBUG?=false

DOCKER_TAG=latest

# Variable to remove rate limits for endpoints in frontend
DISABLE_RATE_LIMITS?=false
RATE_LIMIT = ''
ifeq ($(DISABLE_RATE_LIMITS),true)
RATE_LIMIT = '--disable-rate-limits'
endif
export RATE_LIMIT

ifeq  ($(DEBUG),true)
CONTAINERS:=$(CONTAINERS) debugger
endif

# Can be docker or kubernetes
export TESTING_PLATFORM?=docker

.init:
	@$(call msg,"Initializing ...");
	@if [ ! -f ".firstRun" ]; then \
		make docker-clean && \
		touch .firstRun;\
	fi
	@$(call msg,"Currently on branch ${BRANCH}");
	@if [ "${BRANCH}" != master ]; then \
		if [ "${TEST}" != "1" ]; then \
			echo -e "Non-master branch detected! Submodules will not be updated automatically. \nYou have to run 'make update' for submodules from develop branch and update manually otherwise"; \
			read -r -p "Continue? [Y/n]: " response; \
			case $$response in \
			   [Nn]* ) echo "Bye!"; exit 1; \
			esac \
		fi; \
	else \
		git submodule init; \
		git submodule update; \
	fi;
ifeq ($(wildcard ./setup-environment.sh ),)
	@if [ "${TEST}" != "1" ]; then \
		tput setaf 1; \
		while true; do \
			read -r -p "Use the default config in setup-environment.example.sh file ? [y/N]: " response; \
			case $$response in \
			   	[Yy]* ) cp ./setup-environment.example.sh setup-environment.sh; break;; \
			[Nn]* ) break;; \
				* ) echo "Please answer yes or no.";; \
			esac \
		done ; \
		tput sgr0; \
	else \
		cp ./setup-environment.example.sh setup-environment.sh;	\
	fi
endif

	@if [ "${TEST}" == "1" ]; then \
		if [ -d ./data ] && [ ! -f ./data/.forTest ]; then \
			sudo rm -rf data-backup; \
			sudo mv data data-backup; \
		fi; \
		mkdir -p ./data && touch ./data/.forTest; \
	else \
		if [ -d ./data-backup ]; then \
			sudo rm -rf data; \
			sudo mv data-backup data; \
		fi; \
	fi
	@if [ -f data/hdfs/name ]; then echo "HDFS folder existing already"; else \
		echo "Creating HDFS name and data node"; \
		mkdir -p data/hdfs/name; \
		mkdir -p data/hdfs/data; \
	fi;
	@if [ -f data/zookeeper ]; then echo "Zookeeper folder existing already"; else \
		echo "Creating Zookeeper data folder"; \
		mkdir -p data/zookeeper; \
	mkdir -p data/zookeeper-logs; \
	fi;

	@if [ -f data/keys/hbase/id_rsa ]; then echo "HBase keys existing already"; else \
		mkdir -p data/keys/hbase; \
		ssh-keygen -q -t rsa -P "" -f data/keys/hbase/id_rsa; \
	fi;
	@cp data/keys/hbase/* docker/hbase
	@chmod 755 docker/hbase/id_rsa*

	@if [ -f data/keys/private.pem ]; then echo "RSA keys existing already"; else \
		mkdir -p data/keys; \
		openssl genpkey -algorithm RSA -out data/keys/private.pem -pkeyopt rsa_keygen_bits:2048; \
		openssl rsa -pubout -in data/keys/private.pem -out data/keys/public.pem; \
	fi;
	@if [ -f ${SSL_CERT_PATH}/server.key ]; then echo "SSL key existing already. Skipping creating self signed cert."; else \
		echo "Creating self signed SSL certificate."; \
		mkdir -p ${SSL_CERT_PATH}; \
		openssl req  -nodes -new -x509  -keyout ${SSL_CERT_PATH}/server.key -out ${SSL_CERT_PATH}/server.cert -subj "/C=UK/ST=NRW/L=London/O=My Inc/OU=DevOps/CN=www.streammyiot.com/emailAddress=donotreply@www.streammyiot.com"; \
	fi;
	@if [ -f data/keys/mqtt/mqtt_gw_secret.key ]; then echo "MQTT/GW key existing already. Skipping creating new key"; else \
		echo "Creating MQTT/GW secret."; \
    mkdir -p data/keys/mqtt; \
    openssl rand -base64  16 > data/keys/mqtt/mqtt_gw_secret.key; \
  fi;
	@if [ -f data/kafka ]; then echo "Kafka persitence dir existing already. Skipping creating new dir"; else \
    echo "Creating kafka folder"; \
    mkdir -p data/kafka; \
		chmod 777 data/kafka; \
  fi;

	@if [ -f data/S3 ]; then echo "S3 directory existing already. Skipping creating new dir"; else \
                echo "Creating S3 storage dir."; \
                mkdir -p data/S3; \
  fi;

	@touch $@

## build: Build OISP images locally.
##     You can specify a version using the $DOCKER_TAG argument.
##     $CONTAINERS arg (as whitespace seperated list) specifies which containers should be built,
##     if it is left blank, all containers will be built.
##     If $DEBUG is set to true, debugger will be added to CONTAINERS
##     This command also accepts the argument $DOCKER_COMPOSE_ARGS, which is passed directly to compose.
##
build: .init
	@$(call msg,"Building OISP containers");
	@if [[ $$(printf "opentsdb" | grep "$$(CONTAINERS)") ]]; then \
		./docker.sh -f docker-compose.yml build $(DOCKER_COMPOSE_ARGS) hbase; \
	fi
	@./docker.sh -f docker-compose.yml -f docker/debugger/docker-compose-debugger.yml build $(DOCKER_COMPOSE_ARGS) $(CONTAINERS);

## pull: Pull OISP containers from dockerhub. Requires docker login.
##     You can specify a version using the $DOCKER_TAG argument.
##     $CONTAINERS arg (as whitespace seperated list) specifies which containers should be pulled,
##     if it is left blank, all containers will be pulled.
##     If $DEBUG is set to true, debugger will be added to CONTAINERS
##     This command also accepts the argument $DOCKER_COMPOSE_ARGS, which is passed directly to compose.
##
pull: .init
	@$(call msg, "Pulling OISP containers");
	@docker-compose -f docker-compose.yml -f docker/debugger/docker-compose-debugger.yml pull $(DOCKER_COMPOSE_ARGS) $(CONTAINERS);

## update: Update all subrepositories to latest origin/develop
##     For competabilty, this will also backup and remove setup-environment.sh
##
update: distclean
	@$(call msg,"Git Update (dev only)");
	@if [ -f setup-environment.sh ]; then \
		mv setup-environment.sh config-backup/setup-environment-$$(date +%Y-%m-%d-%H%M%S).sh.bak; \
	fi;
	@git submodule init
	@git submodule update
	@git submodule foreach git fetch origin
	@git submodule foreach git checkout origin/develop

## docker-clean: Remove all docker images and containers.
##     This also includes non-oisp containers.
##
docker-clean:
	@$(call msg,"Removing all docker images and containers ...");
	@read -r -p "Continue? [y/N]: " response; \
	case $$response in \
		[Yy]* ) ./docker.sh stop $(docker ps -a -q); \
		./docker.sh rm -f $(docker ps -a -q); \
		/bin/bash -c "docker images -q | xargs -n 1 -I {} docker rmi -f {}";;  \
		[Nn]* ) echo "Not removing containers";; \
	esac \

## test-prep-only: Prepare test for 3rd party apps like oisp-iot-agent but do not start full e2e test
##     Creates a user with $USERNAME and $PASSWORD, and creates a device with id 00-11-22-33-44-55,
##     dumps the result in oisp-prep-only.conf
##
test-prep-only: export TEST_PREP_ONLY := "1"
test-prep-only: test

## test: Run OISP E2E tests.
##
test: export TEST := "1"
test: .init
	make start-test && source ./tests/.env && cd tests && make TEST_PREP_ONLY=${TEST_PREP_ONLY} test;

## remove: Remove all OISP images from local machine.
##     $CONTAINERS arg (as whitespace seperated list) specifies which containers should be removed,
##     if it is left blank, all containers will removed.
##
remove:
	@$(call msg,"Removing $(CONTAINERS)")
ifeq  ($(CONTAINERS),"")
	make stop;\
	$(eval images:=$(shell docker images --filter label=oisp -q)) \
	docker rmi -f $(images)
else
	@$(foreach container,$(CONTAINERS), \
		echo $container; \
		./docker.sh stop $(container); \
		./docker.sh rm -f -v $(container); \
		docker images | grep  "^.*$(container)" | awk '{print $$3}' | xargs -n 1 -I {} docker rmi -f {}; \
	)
endif

## logs: #TODO update to k8s
## Create a .zip archive containing logs from all containers.
##  The result will be saved in platform-lancuher-logs_{data}.zip
##
logs:
	$(eval LOGS_ARCHIVE := platform-launcher-logs_$(shell date +'%Y-%m-%d_%H-%M-%S'))
	@$(call msg,"Making one archive file with all the containers logs within ( ./$(LOGS_ARCHIVE).zip ) ...");
	@rm -rf /tmp/$(LOGS_ARCHIVE)* && mkdir -p /tmp/$(LOGS_ARCHIVE)
	@docker-compose config --services  2> /dev/null | xargs -r  -n 1 sh -c './docker.sh logs "$$@"  >  /tmp/$(LOGS_ARCHIVE)/"$$@".logs ' logs
	@cd /tmp && zip -q -r ./$(LOGS_ARCHIVE).zip $(LOGS_ARCHIVE)/*.logs
	@mv /tmp/$(LOGS_ARCHIVE).zip .


## clean: Remove .init, forcing a clean-up on the next run.
##
clean:
	@$(call msg,"Cleaning ...");
	@rm -f .init

distclean: clean
	@if [ -f setup-environment.sh ]; then \
		./docker.sh down; \
	fi
	@if [ -f ./data/.forTest ]; then \
		sudo rm -rf ./data; \
	fi

## push images: Push containers to dockerhub.
##     This obviously requires docker login,
##     $CONTAINERS arg selects which containers (whitespace seperated list) should be pushed,
##     if left empty, all containers will be pushed.
##
push-images:
	@$(call msg,"Pushing docker images to registry");
	@./docker.sh -f docker-compose.yml -f docker/debugger/docker-compose-debugger.yml push $(CONTAINERS)

## help: Show this help message
##
help:
	@grep "^##" Makefile | cut -c4-

#----------------------------------------------------------------------------------------------------------------------
# helper functions
#----------------------------------------------------------------------------------------------------------------------

define msg
	tput setaf 2 && \
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo "" && \
	echo -e "\t"$1 && \
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo "" && \
	tput sgr0
endef
