
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

MAKEFILE_DIR := $(abspath $(lastword $(MAKEFILE_LIST)))
CURRENT_DIR  :=  $(patsubst %/,%,$(dir $(MAKEFILE_DIR)))


USERNAME = "oisp@testing.com"
PASSWORD = "OispTesting1"
ROLE = "admin"

#----------------------------------------------------------------------------------------------------------------------
# targets
#----------------------------------------------------------------------------------------------------------------------

all:
	@$(call msg,"Installing npm packages ..."); 
	cd $(CURRENT_DIR) && npm install

test:
	@$(call msg,"Resetting database ..."); 
	@docker exec -it platformlauncher_dashboard_1 node /app/admin resetDB
	
	@$(call msg,"Adding a user for testing ..."); 
	@docker exec -it platformlauncher_dashboard_1 node /app/admin addUser $(USERNAME) $(PASSWORD) $(ROLE)
	
	@$(call msg,"Starting the e2e testing ..."); 
	@env http_proxy="" https_proxy="" USERNAME=$(USERNAME) PASSWORD=$(PASSWORD) LOG_LEVEL="error" NODE_ENV="local" npm test 

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
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo -n "\n" && \
	echo "\t"$1 && \
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo "\n" && \
	tput sgr0
endef
