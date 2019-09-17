SHELL:=/bin/bash

NAMESPACE?=oisp
# Name for HELM deployment
NAME?=oisp

TEMPLATES_DIR?=templates

DEPLOYMENT?=debugger
DEBUGGER_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep debugger | head -n 1)
DASHBOARD_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep dashboard | head -n 1)
SELECTED_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep $(DEPLOYMENT) | head -n 1)
HBASE_MASTER_POD=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep hbase-master | head -n 1)

TEST_REPO?=https://github.com/Open-IoT-Service-Platform/platform-launcher.git
TEST_BRANCH?=develop

DOCKER_TAG?=latest

# Deployment with kubectl
# -----------------------------------------------------------------------------
# Use these functions if you do not have HELM running on your cluster,
# otherwise, deploying the charts is the recommended method

## .docker-cred: Remove this file if you need to update docker credentials
##
.docker-cred:
	@$(call msg, "(Re)creating docker credential secret.")
	@kubectl create namespace $(NAMESPACE) 2>/dev/null || echo Namespace $(NAMESPACE) already exists
	@kubectl -n $(NAMESPACE) delete secret dockercred 2>/dev/null ||:
	@read -p "Docker username:" DOCKER_USERNAME; \
	read -p "Docker e-mail:" DOCKER_EMAIL; \
	read -s -p "Docker password:" DOCKER_PASSWORD; \
	echo -e "\nTesting login"; \
	docker login -u $$DOCKER_USERNAME -p $$DOCKER_PASSWORD 2>/dev/null|| exit 1; \
	kubectl -n $(NAMESPACE) create secret docker-registry dockercred --docker-username=$$DOCKER_USERNAME --docker-password=$$DOCKER_PASSWORD --docker-email=$$DOCKER_EMAIL;
	@touch $@

## clean: Remove all k8s resources by deleting namespace
##
clean:
	@$(call msg, "Removing workspace $(NAMESPACE)")
	-kubectl delete namespace $(NAMESPACE)
	rm -f .docker-cred

check-docker-cred-env:
	@if [ "$$DOCKERUSER" = "" ]; then \
		echo "DOCKERUSER env var is undefined"; exit 1; \
	fi
	@if [ "$$DOCKERPASS" = "" ]; then \
		echo "DOCKERPASS env var is undefined"; exit 1; \
	fi

## deploy-oisp-test: Deploy repository as HELM chart,
## create an ethereal address, and make sure there is
## a debugger container.
## This also takes a $DOCKER_TAG parameter
##
deploy-oisp-test: check-docker-cred-env
	node ./util/ethereal.js util/ethereal_creds;
	. util/ethereal_creds && \
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
		--set tag=$(DOCKER_TAG)

## deploy-oisp: Deploy repository as HELM chart
##
deploy-oisp: check-docker-cred-env
	@helm install . --name $(NAME) --namespace $(NAMESPACE) \
		--set imageCredentials.username="$$DOCKERUSER" \
		--set imageCredentials.password="$$DOCKERPASS";


## undeploy-oisp: Remove OISP deployment by HELM chart
##
undeploy-oisp:
	helm del $(NAME) --purge
	kubectl delete namespace $(NAMESPACE)

# Utils
# ---------------------------------------------------------------------

## open-shell: Open a shell to a random pod in DEPLOYMENT.
##     By default thi will try to open a shell to a debugger pod.
##
open-shell:
	@$(call msg, "Opening shell to pod: $(DEBUGGER_POD)")
	kubectl -n $(NAMESPACE) exec -it $(SELECTED_POD) /bin/bash

## reset-db: Reset database via admin tool in frontend
##
reset-db:
	kubectl -n $(NAMESPACE) exec $(DASHBOARD_POD) --container dashboard -- node admin resetDB

## add-test-user: Add a test user via admin tool in frontend
##
add-test-user:
	for i in $(shell seq 1 1); do kubectl -n $(NAMESPACE) exec $(DASHBOARD_POD) -c dashboard -- node admin addUser user$${i}@example.com password admin; done;


## prepare-tests: Pull the latest repo in the debugger pod
##     This has no permanent effect as the pod on which the tests
##     are prepared is mortal
prepare-tests:
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger -- /bin/bash -c "rm -rf *"
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger -- /bin/bash -c "rm -rf .* || true"
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger -- \
            git clone $(TEST_REPO) -b $(TEST_BRANCH) .

## test: Run tests
## Platform launcher will be cloned from TEST_REPO, branch TEST_BRANCH will be used
## Assumes that the platform is already deployed
##
test: prepare-tests
	kubectl -n $(NAMESPACE) exec $(DEBUGGER_POD) -c debugger \
		-- /bin/bash -c "cp setup-environment.example.sh setup-environment.sh && cd tests && make test TESTING_PLATFORM=kubernetes TERM=xterm"

## proxy: Run kubectl proxy and port-forwarding of various pods
##
proxy:
	-kubectl proxy &
	-kubectl -n $(NAMESPACE) port-forward $(HBASE_MASTER_POD) 16010:16010

## help: Show this help message
##
help:
	@grep "^##" Makefile | cut -c4-

## wait-until-ready: Wait until the platform is up and running
## As of now, this is assumed if all dashboard and backend containers
## are ready.
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

#---------------------------------------------------------------------------------------------------
# helper functions
#---------------------------------------------------------------------------------------------------

define msg
	tput setaf 2 && \
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo "" && \
	echo -e "\t"$1 && \
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo "" && \
	tput sgr0
endef
