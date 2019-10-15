#
# Copyright (c) 2017-2019 Intel Corporation
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

SHELL:=/bin/bash
CURRENT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
export CURRENT_DIR_BASE:=$(shell basename $(CURRENT_DIR))
BRANCH:=$(shell git branch| grep \*| cut -d ' ' -f2)
export TEST = 0

COMPOSE_PROJECT_NAME?="oisp"
CONTAINERS?=$(shell docker-compose --log-level ERROR config --services)
DOCKER_COMPOSE_ARGS?=
K3S_NODE=$(shell docker ps --format '{{.Names}}' | grep k3s_node)
export DOCKER_TAG=latest
export GIT_COMMIT_PLATFORM_LAUNCHER=$(git rev-parse HEAD)
export GIT_COMMIT_FRONTEND=$(git -C oisp-frontend rev-parse HEAD)
export GIT_COMMIT_GEARPUMP=$(git -C oisp-gearpump-rule-engine rev-parse HEAD)
export GIT_COMMIT_WEBSOCKET_SERVER=$(git -C oisp-websocket-server rev-parse HEAD)
export GIT_COMMIT_BACKEND=$(git -C oisp-backend rev-parse HEAD)

DEBUG?=false
ifeq  ($(DEBUG),true)
CONTAINERS:=$(CONTAINERS) debugger
endif

NAMESPACE?=oisp
# Name for HELM deployment
NAME?=oisp

DEPLOYMENT?=debugger
DEBUGGER_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep debugger | head -n 1)
SELECTED_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep $(DEPLOYMENT) | head -n 1)
DASHBOARD_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep dashboard | head -n 1)

.init:
	@$(call msg,"Initializing ...");
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
	@if [ -f docker/hbase/id_rsa ]; then echo "HBase keys existing already"; else \
		ssh-keygen -q -t rsa -P "" -f docker/hbase/id_rsa; \
	fi;
	@chmod 755 docker/hbase/id_rsa*
	@touch $@

# ===================
# DEPLOYMENT COMMANDS
# ===================
check-docker-cred-env:
	@if [ "$$NODOCKERLOGIN" = "true" ]; then \
		echo "Not using a docker registry. Images must be imported"; exit 0; \
	else \
		if [ "$$DOCKERUSER" = "" ]; then \
			echo "DOCKERUSER env var is undefined"; exit 1; \
		fi; \
		if [ "$$DOCKERPASS" = "" ]; then \
			echo "DOCKERPASS env var is undefined"; exit 1; \
		fi; \
		docker login -u $$DOCKERUSER -p $$DOCKERPASS; \
	fi

## deploy-oisp-test: Deploy repository as HELM chart,
##     create an ethereal address, and make sure there is
##     a debugger container.
##     This also takes a $DOCKER_TAG parameter
##
deploy-oisp-test: check-docker-cred-env
	@node ./tests/ethereal.js tests/.env;
	. tests/.env && \
	cd kubernetes && \
	helm install . --name $(NAME) --namespace $(NAMESPACE) \
		--set imageCredentials.username="$$DOCKERUSER" \
		--set imageCredentials.password="$$DOCKERPASS" \
		--set smtp.host="$$SMTP_HOST" \
		--set smtp.port="$$SMTP_PORT" \
		--set smtp.username="$$SMTP_USERNAME" \
		--set smtp.password="$$SMTP_PASSWORD" \
		--set imap.host="$$IMAP_HOST" \
		--set imap.port="$$IMAP_PORT" \
		--set imap.username="$$IMAP_USERNAME" \
		--set imap.password="$$IMAP_PASSWORD" \
		--set numberReplicas.debugger=1 \
		--set tag=$(DOCKER_TAG) \
		$(HELM_ARGS)

## deploy-oisp: Deploy repository as HELM chart
##
deploy-oisp: check-docker-cred-env
	@cd kubernetes && \
	helm install . --name $(NAME) --namespace $(NAMESPACE) \
		--set imageCredentials.username="$$DOCKERUSER" \
		--set imageCredentials.password="$$DOCKERPASS" \
		--set tag=$(DOCKER_TAG) \
		$(HELM_ARGS)

## upgrade-oisp: Upgrade already deployed HELM chart
##
upgrade-oisp: check-docker-cred-env
	@cd kubernetes && \
	helm upgrade $(NAME) . --namespace $(NAMESPACE) \
		--set imageCredentials.username="$$DOCKERUSER" \
		--set imageCredentials.password="$$DOCKERPASS" \
		--set tag=$(DOCKER_TAG) \
		$(HELM_ARGS)


## undeploy-oisp: Remove OISP deployment by HELM chart
##
undeploy-oisp:
	@cd kubernetes && \
	helm del $(NAME) --purge && \
	kubectl delete namespace $(NAMESPACE)

# =====
# UTILS
# =====

## reset-db: Reset database via admin tool in frontend
##
reset-db:
	kubectl -n $(NAMESPACE) exec $(DASHBOARD_POD) --container dashboard -- node admin resetDB

## add-test-user: Add a test user via admin tool in frontend
##
add-test-user:
	for i in $(shell seq 1 1); do kubectl -n $(NAMESPACE) exec $(DASHBOARD_POD) -c dashboard -- node admin addUser user$${i}@example.com password admin; done;

## wait-until-ready: Wait until the platform is up and running
##     As of now, this is assumed if all dashboard and backend containers
##     are ready.
##
wait-until-ready:
	@printf "\nWaiting for pending ";
	@while kubectl -n oisp get pods | grep Pending >> /dev/null; \
		do printf "."; sleep 5; done;
	@printf "Waiting for backend ";
	@while kubectl -n oisp get pods -l=app=backend -o \
        jsonpath="{.items[*].status.containerStatuses[*].ready}" | grep false >> /dev/null; \
		do printf "."; sleep 5; done;
	@printf "\nWaiting for frontend ";
	@while kubectl -n oisp get pods -l=app=dashboard -o \
        jsonpath="{.items[*].status.containerStatuses[*].ready}" | grep false >> /dev/null; \
		do printf "."; sleep 5; done;
	@printf "\nWaiting for mqtt server";
	@while kubectl -n oisp get pods -l=app=mqtt-server -o \
        jsonpath="{.items[*].status.containerStatuses[*].ready}" | grep false >> /dev/null; \
		do printf "."; sleep 5; done;
	@echo

## import-images: Import images listed in CONTAINERS into local cluster
##
import-images:
	@$(foreach image,$(CONTAINERS), \
		printf $(image); \
		docker save oisp/$(image):$(DOCKER_TAG) -o /tmp/$(image) && printf " is saved" && \
		docker cp /tmp/$(image) $(K3S_NODE):/tmp/$(image) && printf ", copied" && \
		docker exec -it $(K3S_NODE) ctr image import /tmp/$(image) >> /dev/null && printf ", imported\n"; \
	)

## open-shell: Open a shell to a random pod in DEPLOYMENT.
##     By default thi will try to open a shell to a debugger pod.
##
open-shell:
	@$(call msg, "Opening shell to pod: $(SELECTED_POD)")
	kubectl -n $(NAMESPACE) exec -it $(SELECTED_POD) /bin/bash

## restart-cluster: Create a new k3s cluster from scratch and
##     install the dependencies for OISP
##
restart-cluster:
	@./util/restart-cluster.sh

# =======
# TESTING
# =======
## prepare-tests: Push the working directory to the debugger pod.
##     This has no permanent effect as the pod on which the tests
##     are prepared is mortal
##
prepare-tests: wait-until-ready
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger -- /bin/bash -c "rm -rf *"
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger -- /bin/bash -c "rm -rf .* || true"
	kubectl -n $(NAMESPACE) cp $(CURRENT_DIR) $(DEBUGGER_POD):/home -c debugger

## test: Run tests
##
test: prepare-tests
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger \
		-- /bin/bash -c "cd /home/$(CURRENT_DIR_BASE)/tests && make test TERM=xterm"

# ==============
# BUILD COMMANDS
# ==============

## build: Build OISP images locally.
##     You can specify a version using the $DOCKER_TAG argument.
##     $CONTAINERS arg (as whitespace seperated list) specifies which containers should be built,
##     if it is left blank, all containers will be built.
##     If $DEBUG is set to true, debugger will be added to CONTAINERS
##     This command also accepts the argument $DOCKER_COMPOSE_ARGS, which is passed directly to compose.
##
build: .init
	@$(call msg,"Building OISP containers");
	@if [[ $$(printf "$(CONTAINERS)" | grep "opentsdb") ]]; then \
		docker-compose -f docker-compose.yml build $(DOCKER_COMPOSE_ARGS) hbase; \
	fi
	@docker-compose -f docker-compose.yml -f docker/debugger/docker-compose-debugger.yml build --parallel $(DOCKER_COMPOSE_ARGS) $(CONTAINERS);

## update: Update all subrepositories to latest origin/develop
##     For competabilty, this will also backup and remove setup-environment.sh
##
update: clean
	@$(call msg,"Git Update (dev only)");
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
		[Yy]* ) docker stop $(docker ps -a -q); \
		docker rm -f $(docker ps -a -q); \
		/bin/bash -c "docker images -q | xargs -n 1 -I {} docker rmi -f {}";;  \
		[Nn]* ) echo "Not removing containers";; \
	esac \

# TODO fix this
## test-prep-only: Prepare test for 3rd party apps like oisp-iot-agent but do not start full e2e test
##     Creates a user with $USERNAME and $PASSWORD, and creates a device with id 00-11-22-33-44-55,
##     dumps the result in oisp-prep-only.conf
##
#test-prep-only: export TEST_PREP_ONLY := "1"
#test-prep-only: test


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
		docker rm -f -v $(container); \
		docker images | grep  "^.*$(container)" | awk '{print $$3}' | xargs -n 1 -I {} docker rmi -f {}; \
	)
endif

## logs:
##     Create a .zip archive containing logs from all containers.
##     The result will be saved in platform-lancuher-logs_{data}.zip
##     This can only be used if the cluster is running locally on k3s.
##
logs:
	$(eval LOGS_ARCHIVE := oisp-logs_$(shell date +'%Y-%m-%d_%H-%M-%S'))
	@$(call msg,"Making one archive file with all the logs within ( ./$(LOGS_ARCHIVE).zip ) ...");
	@rm -rf /tmp/$(LOGS_ARCHIVE)* && mkdir -p /tmp/$(LOGS_ARCHIVE)
	@docker cp $(shell docker ps --format "{{.Names}}" | grep k3s_node):/var/log/pods /tmp/$(LOGS_ARCHIVE)
	@cd /tmp && zip -q -r ./$(LOGS_ARCHIVE).zip $(LOGS_ARCHIVE)/*
	@mv /tmp/$(LOGS_ARCHIVE).zip .


## clean: Remove .init, forcing a clean-up on the next run.
##
clean:
	@$(call msg,"Cleaning ...");
	@rm -f .init

## push images: Push containers to dockerhub.
##     This obviously requires docker login,
##     $CONTAINERS arg selects which containers (whitespace seperated list) should be pushed,
##     if left empty, all containers will be pushed.
##
push-images:
	@$(call msg,"Pushing docker images to registry");
	@docker-compose -f docker-compose.yml -f docker/debugger/docker-compose-debugger.yml push $(CONTAINERS)

## help: Show this help message
##
help:
	@grep "^##" Makefile | cut -c4-

#-----------------
# helper functions
#-----------------

define msg
	tput setaf 2 && \
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo "" && \
	echo -e "\t"$1 && \
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo "" && \
	tput sgr0
endef
