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
EXT_CONTAINERS=cassandra;gcr.io/cassandra-operator/cassandra-3.11.6:v6.4.0 cassandra;gcr.io/cassandra-operator/cassandra-operator:v6.7.0 sidecar;gcr.io/cassandra-operator/instaclustr-icarus:1.0.1 kafka;confluentinc/cp-kafka:5.0.1
CONTAINERS_AGENT=oisp-testsensor oisp-iot-agent
DOCKER_COMPOSE_ARGS?=
K3S_NODE=$(shell docker ps --format '{{.Names}}' | grep k3s_agent)
KEYCLOAK_HELM_REPO:="https://codecentric.github.io/helm-charts"
KEYCLOAK_HELM_REPO_NAME:="codecentric"
export DOCKER_TAG?=latest
export DOCKER_PREFIX?=oisp
export GIT_COMMIT_PLATFORM_LAUNCHER=$(git rev-parse HEAD)
export GIT_COMMIT_FRONTEND=$(git -C oisp-frontend rev-parse HEAD)
export GIT_COMMIT_GEARPUMP=$(git -C oisp-gearpump-rule-engine rev-parse HEAD)
export GIT_COMMIT_WEBSOCKET_SERVER=$(git -C oisp-websocket-server rev-parse HEAD)
export GIT_COMMIT_BACKEND=$(git -C oisp-backend rev-parse HEAD)

NOBACKUP?=false
DEBUG?=false
ifeq  ($(DEBUG),true)
CONTAINERS:=$(CONTAINERS) debugger
endif

export NAMESPACE?=oisp
# Name for HELM deployment
NAME?=$(NAMESPACE)

DEPLOYMENT?=debugger
DEBUGGER_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep debugger | head -n 1)
SELECTED_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep $(DEPLOYMENT) | head -n 1)
FRONTEND_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep frontend | head -n 1)

BACKUP_EXCLUDE:=sh.helm stolon default-token oisp-stolon-token

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
		git submodule update --init --recursive; \
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
# ftp pass checking is disabled, as service jars are hosted in services-server now
# re-enable this if an ftp server is used instead.
#		if [ "$$FTPPASS" = "" ]; then \
#			echo "FTPPASS env var is undefined"; exit 1; \
#		fi; \
	fi

## deploy-oisp-test: Deploy repository as HELM chart,
##     create an ethereal address, and make sure there is
##     a debugger container.
##     This also takes a $DOCKER_TAG parameter
##
deploy-oisp-test: check-docker-cred-env
	make deploy-oisp
	kubectl -n $(NAMESPACE) scale deployment debugger --replicas=1
	# wait for debugger container to become ready (otherwise the next "make" command might failing finding debugger)
	@printf "Waiting for debugger pod to be created";
	@while ! kubectl -n $(NAMESPACE) get pods -l=app=debugger 2> /dev/null | grep debugger >> /dev/null; \
		do printf "."; sleep 5; done;
	@echo
	@printf "Waiting for debugger to become ready ";
	@while kubectl -n $(NAMESPACE) get pods -l=app=debugger -o \
        jsonpath="{.items[*].status.containerStatuses[*].ready}" | grep false >> /dev/null; \
		do printf "."; sleep 5; done;
	@echo

generate_keys:
	@openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048 && \
	openssl rsa -pubout -in private.pem -out public.pem && \
	openssl req -new -x509 -key private.pem -out x509.pem -batch -days 3650;

## deploy-oisp: Deploy repository as HELM chart
##
deploy-oisp: check-docker-cred-env generate_keys
	# First generate ssh keys
	@$(call msg,"Starting first deploy");
	$(eval PUBLICKEY:=$(shell cat public.pem | base64 | tr -d "\n"))
	$(eval PRIVATEKEY:=$(shell cat private.pem | base64 | tr -d "\n"))
	$(eval X509CERT:=$(shell cat x509.pem | base64 | tr -d "\n"))
	cd kubernetes && \
	kubectl create namespace $(NAMESPACE) && \
	POSTGRES_PASSWORD="$(call randomPass)" && \
	helm repo add "${KEYCLOAK_HELM_REPO_NAME}" "${KEYCLOAK_HELM_REPO}" --namespace "${NAMESPACE}" && \
	helm dependency update --namespace $(NAMESPACE) && \
	helm install $(NAME) . --namespace $(NAMESPACE) \
		--timeout 1200s \
		--set imageCredentials.username="$$DOCKERUSER" \
		--set imageCredentials.password="$$DOCKERPASS" \
		--set systemuser.password="$(call randomPass)" \
		--set grafana.password="$(call randomPass)" \
		--set mqtt.broker.password="$(call randomPass)" \
		--set ruleEngine.password="$(call randomPass)" \
		--set ruleEngine.password="$(call randomPass)" \
		--set ruleEngine.ftpPassword="$${FTPPASS}" \
		--set ruleEngine.gearpump.password="$(call randomPass)" \
		--set websocketServer.password="$(call randomPass)" \
		--set stolon.pgSuperuserPassword="$${POSTGRES_PASSWORD}" \
		--set keycloak.keycloak.persistence.dbPassword="$${POSTGRES_PASSWORD}" \
		--set postgres.password="$(call randomPass)" \
		--set keycloak.keycloak.password="$(call randomPass)" \
		--set keycloak.frontend.secret="$(call randomPass)" \
		--set keycloak.mqttBroker.secret="$(call randomPass)" \
		--set keycloak.websocketServer.secret="$(call randomPass)" \
		--set keycloak.fusionBackend.secret="$(call randomPass)" \
		--set jwt.public="$(PUBLICKEY)" \
		--set jwt.private="$(PRIVATEKEY)" \
		--set jwt.x509="$(X509CERT)" \
		--set tag=$(DOCKER_TAG) \
		--set imagePrefix=$(DOCKER_PREFIX) \
		--set keycloak.keycloak.image.repository=$(DOCKER_PREFIX)/keycloak \
		--set keycloak.keycloak.image.tag=$(DOCKER_TAG) \
		$(HELM_ARGS)

## upgrade-oisp: Upgrade already deployed HELM chart
##
upgrade-oisp: check-docker-cred-env backup
	@$(call msg,"Starting upgrade");
	@source util/get_oisp_credentials.sh && \
	cd kubernetes && \
	helm repo add "${KEYCLOAK_HELM_REPO_NAME}" "${KEYCLOAK_HELM_REPO}" --namespace "${NAMESPACE}" && \
	helm dependency update --namespace $(NAMESPACE) && \
	helm upgrade $(NAME) . --namespace $(NAMESPACE) \
		--timeout 600s \
		--set imageCredentials.username="$$DOCKERUSER" \
		--set imageCredentials.password="$$DOCKERPASS" \
		--set systemuser.password="$${SYSTEMUSER_PASSWORD}" \
		--set grafana.password="$${GRAFANA_PASSWORD}" \
		--set mqtt.broker.password="$${MQTT_BROKER_PASSWORD}" \
		--set ruleEngine.password="$${RULEENGINE_PASSWORD}" \
		--set ruleEngine.gearpump.password="$${RULEENGINE_GEARPUMP_PASSWORD}" \
		--set websocketServer.password="$${WEBSOCKETSERVER_PASSWORD}" \
		--set stolon.pgSuperuserPassword="$${POSTGRES_SU_PASSWORD}" \
		--set keycloak.keycloak.persistence.dbPassword="$${POSTGRES_SU_PASSWORD}" \
		--set postgres.password="$${POSTGRES_PASSWORD}" \
		--set keycloak.keycloak.password="$${KEYCLOAK_PASSWORD}" \
		--set keycloak.frontend.secret="$${KEYCLOAK_FRONTEND_SECRET}" \
		--set keycloak.mqttBroker.secret="$${KEYCLOAK_MQTT_BROKER_SECRET}" \
		--set keycloak.websocketServer.secret="$${KEYCLOAK_WEBSOCKET_SERVER_SECRET}" \
		--set keycloak.fusionBackend.secret="$${KEYCLOAK_FUSION_BACKEND_SECRET}" \
		--set jwt.public="$${JWT_PUBLIC}" \
		--set jwt.private="$${JWT_PRIVATE}" \
		--set jwt.x509="$${JWT_X509}" \
		--set tag=$(DOCKER_TAG) \
		--set imagePrefix=$(DOCKER_PREFIX) \
		--set keycloak.keycloak.image.repository=$(DOCKER_PREFIX)/keycloak \
		--set keycloak.keycloak.image.tag=$(DOCKER_TAG) \
		$(HELM_ARGS)


## undeploy-oisp: Remove OISP deployment by HELM chart
##
undeploy-oisp:
	@cd kubernetes && \
	(kubectl delete -n $(NAMESPACE) bs --all || echo "Beam services not (or already) deleted") && \
	( helm uninstall $(NAME) --namespace $(NAMESPACE) || echo helm uninstall failed)  && \
	(kubectl delete namespace $(NAMESPACE) || echo "namespace not (or already) deleted") && \
	(kubectl -n cassandra delete cassandradatacenter $(NAMESPACE) || echo "cassandra dc not (or already) deleted")
# Beam services must be deleted first, otherwise the finalizer (operator) is down, and deletation does not work.

# =====
# UTILS
# =====


## reset-db: Reset database via admin tool in frontend
##
reset-db:
	kubectl -n $(NAMESPACE) exec $(FRONTEND_POD) --container frontend -- node admin resetKeycloakUsers
	kubectl -n $(NAMESPACE) exec $(FRONTEND_POD) --container frontend -- node admin resetDB

## add-test-user: Add a test user via admin tool in frontend
##
add-test-user:
	for i in $(shell seq 1 1); do kubectl -n $(NAMESPACE) exec $(FRONTEND_POD) -c frontend -- node admin addUser user$${i}@example.com password; done;

## wait-until-ready: Wait until the platform is up and running
##     As of now, this is assumed if all frontend and backend containers
##     are ready.
##     In case of timeout, the application will be redeployed ONLY if TEST is set
wait-until-ready:
	@{ printf "\nWaiting for readiness of platform"; \
	DOCKER_TAG=$(DOCKER_TAG); \
	if [ "$${DOCKER_TAG}" = "latest" ]; then \
	  export DOCKER_TAG=test; \
	fi; \
	$(SHELL) ./wait-until-ready.sh $(NAMESPACE); \
	retval=$$?; \
	if [ $${retval} -eq 2 ]; then \
		printf "\nTimeout while waiting for platform\n"; \
		exit 2; \
	fi }

## import-images: Import images listed in CONTAINERS into local cluster
##
import-images:
	$(foreach image,$(CONTAINERS), \
		printf $(image) && \
		docker tag $(DOCKER_PREFIX)/$(image):$(DOCKER_TAG) k3d-oisp.localhost:12345/$(DOCKER_PREFIX)/$(image):$(DOCKER_TAG) && \
		docker push k3d-oisp.localhost:12345/$(DOCKER_PREFIX)/$(image):$(DOCKER_TAG) && \
		printf ", imported\n"
	)
	@$(foreach image,$(EXT_CONTAINERS), \
		arr=( $(subst ;, ,$(image)) ); \
		printf $${arr[1]};  \
		docker pull $${arr[1]} > /dev/null && printf ", pulled" && \
		docker tag $${arr[1]} k3d-oisp.localhost:12345/$${arr[1]} && \
		docker push k3d-oisp.localhost:12345/$${arr[1]} && \
		printf ", saved\n";
	)

## import-images-agent: Import images to deploy OISP-Agent
##
import-images-agent:
	@$(foreach image,$(CONTAINERS_AGENT), \
		printf $(image) && \
		docker tag $(DOCKER_PREFIX)/$(image):$(DOCKER_TAG) k3d-oisp.localhost:12345/$(DOCKER_PREFIX)/$(image):$(DOCKER_TAG) && \
		docker push k3d-oisp.localhost:12345/$(DOCKER_PREFIX)/$(image):$(DOCKER_TAG) && \
		printf ", imported\n"
	)

## open-shell: Open a shell to a random pod in DEPLOYMENT.
##     By default thi will try to open a shell to a debugger pod.
##
open-shell:
	@$(call msg, "Opening shell to pod: $(SELECTED_POD)")
	kubectl -n $(NAMESPACE) exec -it $(SELECTED_POD) /bin/bash


##     install the dependencies for OISP
##
restart-cluster:
	@cd util && \
	./restart-cluster.sh

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
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger -- /bin/bash -c "pkill node || true"
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger -- fake-smtp-server -s 2525 > /dev/null 2>&1 &
	kubectl -n $(NAMESPACE) cp $(CURRENT_DIR) $(DEBUGGER_POD):/home -c debugger

## test: Run tests
##
test: OISP_TESTS_SKIP_SCALE ?= "true"
test: prepare-tests test-prep-only
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger \
		-- /bin/bash -c "cd /home/$(CURRENT_DIR_BASE)/tests && make test TERM=xterm NAMESPACE=$(NAMESPACE) OISP_TESTS_SKIP_SCALE=$(OISP_TESTS_SKIP_SCALE)"

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
# Normally, the following should be enough, but it can crash in merge conflicts
# Everything is run twice to allow submodules of submodules, if the .gitmodules
# file is different at HEAD than latest develop.
#	@git submodule update --init --recursive --remote --merge
	@$(call msg,"Git Update (dev only)");
	@git submodule update --init
	@git submodule foreach --recursive "git fetch origin && git checkout origin/develop && git submodule update --init"
	@git submodule foreach --recursive "git fetch origin && git checkout origin/develop"

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
test-prep-only: prepare-tests
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger \
		-- /bin/bash -c "cd /home/$(CURRENT_DIR_BASE)/tests && make test-prepare-only TERM=xterm NAMESPACE=$(NAMESPACE)"
	kubectl cp $(NAMESPACE)/$(DEBUGGER_POD):/home/$(CURRENT_DIR_BASE)/tests/oisp-prep-only.conf tests/oisp-prep-only.conf


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


## test-backup: Test backup
##     Assumes test-prep-only executed before
##     then make backup, redeploying OISP and restore backup. Check the users, devices, etc.
##     NOTE: NAMESPACE and DOCKERTAG need to be set
##
test-backup: prepare-tests test-prep-only
	@$(call msg,"Testing backup and restore ...");
	$(eval ACCOUNTID := $(shell jq ".accountId" tests/oisp-prep-only.conf))
	$(eval ACTIVATIONCODE := $(shell jq ".activationCode" tests/oisp-prep-only.conf))
	$(eval USERNAME := $(shell jq ".username" tests/oisp-prep-only.conf))
	$(eval PASSWORD := $(shell jq ".password" tests/oisp-prep-only.conf))
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger \
		-- /bin/bash -c "cd /home/$(CURRENT_DIR_BASE)/tests && \
		make test-backup-before TERM=xterm NAMESPACE=$(NAMESPACE) \
		ACCOUNTID=$(ACCOUNTID) ACTIVATIONCODE=$(ACTIVATIONCODE) USERNAME=$(USERNAME) PASSWORD=$(PASSWORD)"
	$(MAKE) backup
	$(MAKE) undeploy-oisp
	$(MAKE) NAMESPACE=$(NAMESPACE) DEBUG=$(DEBUG) DOCKER_TAG=$(DOCKER_TAG) deploy-oisp-test
	$(MAKE) restore
	FRONTEND=$$(kubectl -n $(NAMESPACE) get pods | grep frontend| cut -d " " -f 1) && \
	kubectl -n $(NAMESPACE) delete pod keycloak-0 $${FRONTEND}
	DEBUGGER_POD=$$(kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep debugger | head -n 1) && \
	$(MAKE) NAMESPACE=$(NAMESPACE) DEBUGGER_POD=$${DEBUGGER_POD} prepare-tests && \
	kubectl -n $(NAMESPACE) exec $${DEBUGGER_POD} -c debugger \
		-- /bin/bash -c "cd /home/$(CURRENT_DIR_BASE)/tests && \
		make test-backup-after TERM=xterm NAMESPACE=$(NAMESPACE) \
		ACCOUNTID=$(ACCOUNTID) ACTIVATIONCODE=$(ACTIVATIONCODE) USERNAME=$(USERNAME) PASSWORD=$(PASSWORD)"




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


## backup: backup database, configmaps and secrets.
##     This requires either default K8s config or KUBECONFIG set
##     A tar file is created containing the files
##
backup:
ifeq ($(NOBACKUP),false)
	@$(call msg,"Creating backup");
	@mkdir -p backups
	@$(eval TMPDIR := backup_$(NAMESPACE)_$(shell date +'%Y-%m-%d_%H-%M-%S'))
	@$(eval TARGETNAME := backup_$(NAMESPACE)_daily_$(shell date -Iseconds).tgz)
	@if [ -d "/tmp/$(TMPDIR)" ]; then echo "Backup file already exists. Not overwriting. Bye"; exit 1; fi
	@mkdir -p /tmp/$(TMPDIR)
	@util/backup/db_dump.sh /tmp/$(TMPDIR) $(NAMESPACE)  2>&1 || exit 1
	@util/backup/cm_dump.sh /tmp/$(TMPDIR) $(NAMESPACE) "$(BACKUP_EXCLUDE)" 2>&1 || exit 1
	@tar cvzf backups/$(TARGETNAME) -C /tmp $(TMPDIR)
	@rm -rf /tmp/$(TMPDIR)
endif
ifdef S3BUCKET
	s3cmd put backups/$(TARGETNAME) $(S3BUCKET)/$(TARGETNAME)
endif

## purge-backups: looks into S3 Bucket or local backups folder and purges
##                daily backups older than 7 days. Keeps one backup per month.
##     This requires either default K8s config or KUBECONFIG set
##     A tar file is created containing the files
##
purge-backups:
	@$(call msg,"Purging backups");
ifdef S3BUCKET
	@echo Purging S3 backups in $(S3BUCKET)
	@util/backup/purge_backup.sh $(S3BUCKET)
else
	@echo purging local backups
	@util/backup/purge_backup.sh backups
endif


## restore: restore database, configmaps and secrets.
##     This requires either default K8s config or KUBECONFIG set
##     Parameters: BACKUPFILE var must be set or the most recent timestamp is selected
##
restore:
ifdef S3BUCKET
	@if [ -z "$(BACKUPFILE)" ]; then echo "BACKUPFILE should be set when S3BUCKET is set"; exit 1; fi
endif
ifndef BACKUPFILE
		@echo Look for most recent backup file
		@$(eval BACKUPFILE := $(shell ls backups/backup_*|sort -V| head -n 1))
endif
	@$(eval TMPDIR := backup_$(NAMESPACE)_$(shell date +'%Y-%m-%d_%H-%M-%S'))
	@echo using backup file $(BACKUPFILE) and copying to localfile $(TMPDIR).tgz
ifdef S3BUCKET
	@echo Copy $(BACKUPFILE) from bucket $(S3BUCKET) to /tmp/$(BACKUPFILE)
	@s3cmd get $(S3BUCKET)/$(BACKUPFILE)  /tmp/$(TMPDIR).tgz || exit 1
else
	@cp $(BACKUPFILE) /tmp/$(TMPDIR).tgz
endif
	@mkdir /tmp/$(TMPDIR)
	@tar xvzf /tmp/$(TMPDIR).tgz --strip-components=1 -C /tmp/$(TMPDIR)

	@util/backup/cm_check.sh /tmp/$(TMPDIR) $(NAMESPACE)
	@util/backup/db_restore.sh /tmp/$(TMPDIR) $(NAMESPACE)
	@util/backup/cm_restore.sh /tmp/$(TMPDIR) $(NAMESPACE)
ifdef S3BUCKET
	@rm -rf /tmp/$(BACKUPFILE)
else
	@rm -rf /tmp/$(TMPDIR) /tmp/$(TMPDIR).tgz
endif

## backup-db only, backup is saved in backups/database.sql
##
backup-db:
	$(call msg, "Creating DB backup");
	mkdir -p backups;
	util/backup/db_dump.sh backups $(NAMESPACE)

## restore-db only, from backups/database.sql
##
restore-db:
ifndef BACKUPFILE
	$(eval BACKUPFIL := backups/database.sql)
endif
	$(call msg, "Restoring DB backup");
	export DBONLY=true && util/backup/db_restore.sh backups/ $(NAMESPACE)

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

define randomPass
$$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c$${1:-64})
endef
