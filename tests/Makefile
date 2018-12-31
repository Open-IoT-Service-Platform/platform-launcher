
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

USERNAME2 = "oisp2@testing.com"
PASSWORD2 = "OispTesting2"
ROLE2 = "admin"

ifeq ($(TESTING_PLATFORM), docker)
KAFKA_BROKER="localhost:9092"
else
KAFKA_BROKER="kafka:9092"
NAMESPACE=oisp
DASHBOARD_POD:=$(shell kubectl -n oisp get pods -o custom-columns=:metadata.name | grep dashboard | head -n 1)
endif

#----------------------------------------------------------------------------------------------------------------------
# targets
#----------------------------------------------------------------------------------------------------------------------

npm-install:
	@$(call msg,"Installing npm packages ...");
	@cd $(CURRENT_DIR) && npm install > /dev/null


test: npm-install
	@cp test-config-$(TESTING_PLATFORM).json test-config.json
	@$(call msg,"Waiting for frontend and test Kafka readiness");
# fill in separator to avoid accidentially dashboard being most recent heartbeat.
# Then look always for latest heartbeat
	@until echo new-test | kafkacat -P -b $(KAFKA_BROKER) -t heartbeat; do echo "Kafka not ready. Waiting ..."; sleep 1; done
	@ (for i in {1..4}; do echo new-test ; done) | kafkacat -P -b $(KAFKA_BROKER) -t heartbeat;
	@. ../setup-environment.sh && until kafkacat -C -b $(KAFKA_BROKER) -t heartbeat -e -o -4 2> /dev/null | grep -m 1 "dashboard"; do sleep 1 ; done

ifeq ($(TESTING_PLATFORM), docker)
	@$(call msg,"Resetting database ...");
	@. ../setup-environment.sh && docker exec -i "$${COMPOSE_PROJECT_NAME}_frontend_1" node /app/admin resetDB

	@$(call msg,"Adding a user for testing ...");
	@. ../setup-environment.sh && docker exec -i "$${COMPOSE_PROJECT_NAME}_frontend_1" node /app/admin addUser $(USERNAME) $(PASSWORD) $(ROLE) > /dev/null
	@. ../setup-environment.sh && docker exec -i "$${COMPOSE_PROJECT_NAME}_frontend_1" node /app/admin addUser $(USERNAME2) $(PASSWORD2) $(ROLE2) > /dev/null
else
	@$(call msg,"Resetting database ...");
	@kubectl exec -i $(DASHBOARD_POD) -c dashboard --  node /app/admin resetDB

	@$(call msg,"Adding a user for testing ...");
	@kubectl exec -i $(DASHBOARD_POD) -c dashboard --  node /app/admin addUser $(USERNAME) $(PASSWORD) $(ROLE) > /dev/null

endif
	@$(call msg,"Starting the e2e testing ...");
	@. ../setup-environment.sh && env http_proxy="" https_proxy="" USERNAME=$(USERNAME) PASSWORD=$(PASSWORD) USERNAME2=$(USERNAME2) PASSWORD2=$(PASSWORD2) LOG_LEVEL="error" NODE_ENV="local" npm test

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
