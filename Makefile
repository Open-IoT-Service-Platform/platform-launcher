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

.init:
	@$(call msg,"Initializing ...");
	git submodule init
	git submodule update --remote --merge
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
	@docker run -it -v $(shell pwd)/oisp-frontend:/app platformlauncher_dashboard /bin/bash \
		-c /app/public-interface/scripts/docker-prepare.sh
	@touch $@

build-force: .init
	@$(call msg,"Building IoT connector ...");
	@./docker.sh create --force-recreate

start: build .prepare
	@$(call msg,"Starting IoT connector ...");
	@./docker.sh up -d

start-test: build .prepare
	@$(call msg,"Starting IoT connector (test mode) ..."); 
	@env TEST="1" ./docker.sh up -d

stop:
	@$(call msg,"Stopping IoT connector ...");
	@./docker.sh stop

update:
	@$(call msg,"Git Update ...");
	@git pull
	@git submodule init
	@git submodule update --remote --merge
	@git submodule foreach git pull origin master

test: start-test
	@cd tests && make && make test

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
