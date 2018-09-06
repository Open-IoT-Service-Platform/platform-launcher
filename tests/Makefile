
# Copyright (c) 2017 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#    http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


#----------------------------------------------------------------------------------------------------------------------
# Configs
#----------------------------------------------------------------------------------------------------------------------
SHELL:=/bin/bash

MAKEFILE_DIR := $(abspath $(lastword $(MAKEFILE_LIST)))
CURRENT_DIR  :=  $(patsubst %/,%,$(dir $(MAKEFILE_DIR)))

USERNAME = "oisp@testing.com"
PASSWORD = "OispTesting1"
ROLE = "admin"

#----------------------------------------------------------------------------------------------------------------------
# targets
#----------------------------------------------------------------------------------------------------------------------

npm-install:
	@$(call msg,"Installing npm packages ...");
	@cd $(CURRENT_DIR) && npm install > /dev/null

test: npm-install
	@$(call msg,"Waiting for frontend");
# fill in separator to avoid accidentially dashboard being most recent heartbeat.
# Then look always for latest heartbeat
	@ (for i in {1..4}; do echo new-test ; done) | kafkacat -P -b localhost:9092 -t heartbeat;
	@. ../setup-environment.sh && until kafkacat -b localhost:9092 -t heartbeat -e -o -4 2> /dev/null | grep -m 1 "dashboard"; do sleep 1 ; done

	@$(call msg,"Resetting database ...");
	@. ../setup-environment.sh && docker exec -i "$${COMPOSE_PROJECT_NAME}_frontend_1" node /app/admin resetDB

	@$(call msg,"Adding a user for testing ...");
	@. ../setup-environment.sh && docker exec -i "$${COMPOSE_PROJECT_NAME}_frontend_1" node /app/admin addUser $(USERNAME) $(PASSWORD) $(ROLE) > /dev/null

	@$(call msg,"Starting the e2e testing ...");
	@. ../setup-environment.sh && env http_proxy="" https_proxy="" USERNAME=$(USERNAME) PASSWORD=$(PASSWORD) LOG_LEVEL="error" NODE_ENV="local" npm test

ifeq (email-account,$(firstword $(MAKECMDGOALS)))
 	OUTPUT_FILE := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
 	$(eval $(OUTPUT_FILE):;@:)
endif

email-account: npm-install
	@$(call msg,"Creating ethereal email account");
	@node ./ethereal.js $(OUTPUT_FILE)

clean:
	@$(call msg,"Cleaning ...");

distclean: clean
	@$(call msg,"Dist cleaning ...");
	@rm -rf $(CURRENT_DIR)/iotkit-agent

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
