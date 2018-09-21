NAMESPACE?=oisp
SHELL:=/bin/bash

TEMPLATES_DIR?=templates

DEPLOYMENT?=debugger
DEBUGGER_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep debugger | head -n 1)
SELECTED_POD:=$(shell kubectl -n $(NAMESPACE) get pods -o custom-columns=:metadata.name | grep $(DEPLOYMENT) | head -n 1)


test-k8s:
	@$(call msg, "Testing on local k8s cluster");
	kafkacat -b kafka:9092 -t heartbeat

## import-debugger: Launch or update debugger pod in NAMESPACE (default:oisp)
## 
import-debugger:
	kubectl apply -n $(NAMESPACE) -f $(TEMPLATES_DIR)/test

## .docker-cred: Remove this file if you need to update docker credentials
##
.docker-cred:
	@$(call msg, "(Re)creating docker credential secret.")
	@-kubectl create namespace $(NAMESPACE)
	@-kubectl -n $(NAMESPACE) delete secret dockercred
	@read -p "Docker username:" DOCKER_USERNAME; \
	read -p "Docker e-mail:" DOCKER_EMAIL; \
	read -s -p "Docker password:" DOCKER_PASSWORD; \
	kubectl -n $(NAMESPACE) create secret docker-registry dockercred --docker-username=$$DOCKER_USERNAME --docker-password=$$DOCKER_PASSWORD --docker-email=$$DOCKER_EMAIL;
	@touch $@

## import-templates: Launch or update platform on k8s by importing the templates found in TEMPLATES_DIR
##     The resources will be loaded into NAMESPACE (default: oisp)
##
import-templates: .docker-cred
	@$(call msg, "Importing into namespace:$(NAMESPACE)")

	-kubectl create namespace $(NAMESPACE)

	kubectl apply -n $(NAMESPACE) -f $(TEMPLATES_DIR)/configmaps
	kubectl apply -n $(NAMESPACE) -f $(TEMPLATES_DIR)/secrets
	kubectl apply -n $(NAMESPACE) -f $(TEMPLATES_DIR)/persistentvolumes
	kubectl apply -n $(NAMESPACE) -f $(TEMPLATES_DIR)


## export-templates: Export templates in NAMESPACE in running k8s cluster to TEMPLATES_DIR
##     This does not follow the exact same directory structure as in import-templates
##
export-templates:
	@for n in $$(kubectl get -n $(NAMESPACE) -o=name pvc,configmap,secret,ingress,service,deployment,statefulset,hpa); do \
	mkdir -p $(TEMPLATES_DIR)/$$(dirname $$n); \
	kubectl get -n $(NAMESPACE) -o=yaml --export $$n > $(TEMPLATES_DIR)/$$n.yaml; \
	done

## clean: Remove all k8s resources by deleting namespace
##
clean:
	@$(call msg, "Removing workspace $(NAMESPACE)")
	-kubectl delete namespace $(NAMESPACE)
	rm -f .docker-cred

# Storage is created and deleted manually temporarily
# In the future, there should be a better way to chose waht kind of storage will be used,
# and not default 
	kubectl delete pv storage-redis storage-hbase storage-postgres

## open-shell: Open a shell to a random pod in DEPLOYMENT.
##     By default thi will try to open a shell to a debugger pod.
##
open-shell:
	@$(call msg, "Opening shell to pod: $(DEBUGGER_POD)")
	kubectl -n $(NAMESPACE) exec -it $(SELECTED_POD) /bin/bash

## help: Show this help message
##
help:
	@grep "^##" Makefile | cut -c4-


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
