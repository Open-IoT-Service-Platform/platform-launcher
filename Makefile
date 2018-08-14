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
export HOST_IP_ADDRESS=$(shell ifconfig docker0 | sed -En 's/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p')
SSL_CERT_PATH:=data/keys/ssl
COMPOSE_PROJECT_NAME?="oisp"
DOCKER_REGISTRY=localhost:5000/

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
	@touch $@

build: .init
	@$(call msg,"Building IoT connector ...");
	@./docker.sh create

build-force: .init
	@$(call msg,"Building IoT connector ...");
	@./docker.sh create --force-recreate

build-quick: .init
	@$(call msg,"Building IoT connector by pulling images...");
	@./docker.sh -f docker-compose-quick.yml create

ifeq (start,$(firstword $(MAKECMDGOALS)))
 	CMD_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
 	$(eval $(CMD_ARGS):;@:)
endif

start: build
	@$(call msg,"Starting IoT connector ...");
	@./docker.sh up -d $(CMD_ARGS)

start-test: export TEST := "1"
start-test: build
	@$(call msg,"Starting IoT connector (test mode) ...");
	@make -C tests email-account $(shell pwd)/tests/.env
	@source ./tests/.env  && ./docker.sh up -d

start-quick: build-quick
	@$(call msg,"Starting IoT connector using pulled images...");
	@./docker.sh -f docker-compose-quick.yml up -d $(CMD_ARGS)

ifeq (stop,$(firstword $(MAKECMDGOALS)))
 	CMD_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
 	$(eval $(CMD_ARGS):;@:)
endif

stop:
	@$(call msg,"Stopping IoT connector ...");
	@./docker.sh stop $(CMD_ARGS)

update: distclean
	@$(call msg,"Git Update (dev only) ...");
	@git pull
	@if [ -f setup-environment.sh ]; then \
		mv setup-environment.sh config-backup/setup-environment-$$(date +%Y-%m-%d-%H%M%S).sh.bak; \
	fi;
	@git submodule init
	@git submodule update
	@git submodule foreach git fetch origin
	@git submodule foreach git checkout origin/develop

docker-clean:
	@$(call msg,"Removing docker images and containers ...");
	@make remove


ifeq (test,$(firstword $(MAKECMDGOALS)))
 	NB_TESTS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
ifeq ($(NB_TESTS),)
	NB_TESTS :=  1
endif
 	$(eval $(NB_TESTS):;@:)
endif

test: export TEST := "1"
test:
	@for ((i=0; i < ${NB_TESTS}; i++)) do \
		cd $(CURRENT_DIR) && \
		make start-test && \
		source ./tests/.env && cd tests && make test; \
	done


ifeq (remove,$(firstword $(MAKECMDGOALS)))
 	CMD_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
 	$(eval $(CMD_ARGS):;@:)
endif

remove:
	@$(call msg,"Removing $(CMD_ARGS) ...");
ifeq ($(CMD_ARGS),)
	@./docker.sh stop $(docker ps -a -q);
	@./docker.sh rm -f $(docker ps -a -q);
	@/bin/bash -c "docker images -q | xargs -n 1 -I {} docker rmi -f {}"

else
	@$(foreach container,$(CMD_ARGS), \
		./docker.sh stop $(container); \
		./docker.sh rm -f -v $(container); \
		docker images | grep  "^.*$(container)" | awk '{print $$3}' | xargs -n 1 -I {} docker rmi -f {}; \
	)
 endif


logs:
	$(eval LOGS_ARCHIVE := platform-launcher-logs_$(shell date +'%Y-%m-%d_%H-%M-%S'))
	@$(call msg,"Making one archive file with all the containers logs within ( ./$(LOGS_ARCHIVE).zip ) ...");
	@rm -rf /tmp/$(LOGS_ARCHIVE)* && mkdir -p /tmp/$(LOGS_ARCHIVE)
	@docker-compose config --services  2> /dev/null | xargs -r  -n 1 sh -c './docker.sh logs "$$@"  >  /tmp/$(LOGS_ARCHIVE)/"$$@".logs ' logs
	@cd /tmp && zip -q -r ./$(LOGS_ARCHIVE).zip $(LOGS_ARCHIVE)/*.logs
	@mv /tmp/$(LOGS_ARCHIVE).zip .

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

push-docker-images:
	source setup-environment.sh && \
	for img in $$(docker images | grep -oEi $$COMPOSE_PROJECT_NAME"_(\S*)" | cut -d _ -f 2); do \
		docker tag $${COMPOSE_PROJECT_NAME}_$${img} ${DOCKER_REGISTRY}$${COMPOSE_PROJECT_NAME}/$${img}; \
		docker push ${DOCKER_REGISTRY}$${COMPOSE_PROJECT_NAME}/$${img}; \
	done


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
