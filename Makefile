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

.init:
	@$(call msg,"Initializing ...");
	@$(call msg,"Currently on branch ${BRANCH}");
	@if [ "${BRANCH}"x = developx ]; then \
		$(call msg, "develop branch detected! Submodules will not be updated automatically. You have to 'make update' to get the most recent develop submodules!"); \
		read -r -p "Continue? [Y/n]: " response; \
		case $$response in \
		   [Nn]* ) echo "Bye!"; exit 1; \
		esac \
	else \
	git submodule init; \
	git submodule update; \
	fi;
ifeq ($(wildcard ./setup-environment.sh ),)
	@tput setaf 1
	@while true; do \
		read -r -p "Use the default config in setup-environment.example.sh file ? [y/N]: " response; \
		case $$response in \
		   	[Yy]* ) cp ./setup-environment.example.sh setup-environment.sh; break;; \
		[Nn]* ) break;; \
			* ) echo "Please answer yes or no.";; \
		esac \
	done ;
	@tput sgr0
endif
	@if [ -f data/keys/private.pem ]; then echo "RSA keys existing already"; else \
		mkdir -p data/keys; \
		openssl genpkey -algorithm RSA -out data/keys/private.pem -pkeyopt rsa_keygen_bits:2048; \
		openssl rsa -pubout -in data/keys/private.pem -out data/keys/public.pem; \
	fi;
	@touch $@

build: .init
	@$(call msg,"Building IoT connector ...");
	@./docker.sh create

.prepare:
	@docker run -i -v $(shell pwd)/oisp-frontend:/app platformlauncher_dashboard /bin/bash \
		-c /app/public-interface/scripts/docker-prepare.sh 
	cp ./oisp-frontend/public-interface/deploy/postgres/base/*.sql ./oisp-frontend/public-interface/scripts/database 
	@touch $@

build-force: .init
	@$(call msg,"Building IoT connector ...");
	@./docker.sh create --force-recreate

ifeq (start,$(firstword $(MAKECMDGOALS)))
 	CMD_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
 	$(eval $(CMD_ARGS):;@:)
endif

start: build .prepare
	@$(call msg,"Starting IoT connector ...");
	@./docker.sh up -d $(CMD_ARGS)

start-test: build .prepare
	@$(call msg,"Starting IoT connector (test mode) ..."); 
	@env TEST="1" ./docker.sh up -d 

ifeq (stop,$(firstword $(MAKECMDGOALS)))
 	CMD_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
 	$(eval $(CMD_ARGS):;@:)
endif

stop:
	@$(call msg,"Stopping IoT connector ...");
	@./docker.sh stop $(CMD_ARGS)

update:
	@$(call msg,"Git Update (dev only) ...");
	@git pull
	@git submodule init
	@git submodule update
	@git submodule foreach git fetch origin
	@git submodule foreach git checkout origin/develop

ifeq (test,$(firstword $(MAKECMDGOALS)))
 	NB_TESTS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
ifeq ($(NB_TESTS),)
	NB_TESTS :=  1
endif
 	$(eval $(NB_TESTS):;@:)
endif

test: 
	@for ((i=0; i < ${NB_TESTS}; i++)) do \
		cd $(CURRENT_DIR) && \
		sudo make distclean && \
		make start-test && \
		cd tests && make && make test; \
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
	@rm -f .init .prepare

distclean: clean
	@./docker.sh down
	@rm -rf ./data



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
