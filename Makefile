
#----------------------------------------------------------------------------------------------------------------------
# targets
#----------------------------------------------------------------------------------------------------------------------

.init:
	@$(call msg,"Initializing ..."); 
	git submodule init
	git submodule update --remote --merge
	cp setup-environment.example.sh setup-environment.sh
	sudo usermod -aG docker ${USER}
	if [ -f iotanalytics-dashboard/public-interface/keys/private.pem ]; then echo "private keys in dashboard existing. Not updated"; else \
		openssl genpkey -algorithm RSA -out iotanalytics-dashboard/public-interface/keys/private.pem -pkeyopt rsa_keygen_bits:2048;\
		openssl rsa -pubout -in iotanalytics-dashboard/public-interface/keys/private.pem -out iotanalytics-dashboard/public-interface/keys/public.pem; \
	fi;
	if [ -f iotanalytics-websocket-server/security/private.pem ]; then echo "private keys in websocket-server existing. Not updated!"; else \
	openssl genpkey -algorithm RSA -out iotanalytics-websocket-server/security/private.pem -pkeyopt rsa_keygen_bits:2048;\
	openssl rsa -pubout -in iotanalytics-websocket-server/security/private.pem -out iotanalytics-websocket-server/security/public.pem;\
	fi
	@touch $@

build: .init
	@$(call msg,"Building IoT connector ..."); 
	@/bin/bash -c "./docker.sh create "
	@/bin/bash -c "./docker.sh run --no-deps dashboard npm install"
	@/bin/bash -c "./docker.sh run --no-deps websocket-server npm install"


build-force: .init
	@$(call msg,"Building IoT connector ..."); 
	@/bin/bash -c "./docker.sh create --force-recreate "

start: build
	@$(call msg,"Starting IoT connector ..."); 
	@/bin/bash -c "( (service --status-all | grep -q redis-server) && (systemctl stop redis-server) ) || true"
	@/bin/bash -c "./docker.sh up "

stop: 
	@$(call msg,"Stopping IoT connector ..."); 
	@/bin/bash -c "./docker.sh stop "


update:
	@$(call msg,"Git Update ..."); 
	@git pull
	@@git submodule update

clean:
	@$(call msg,"Cleaning ..."); 
	@rm -f .init

distclean: clean
	@/bin/bash -c "./docker.sh down "
	@rm -rf ./data


#----------------------------------------------------------------------------------------------------------------------
# helper functions
#----------------------------------------------------------------------------------------------------------------------
checkIsUsbDevice = $(shell readlink /sys/block/$(shell echo $1 | awk -F "/" '{printf $$3}') | grep  usb )

define msg
	tput setaf 2 && \
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo -n "\n" && \
	echo "\t"$1 && \
	for i in $(shell seq 1 120 ); do echo -n "-"; done; echo "\n" && \
	tput sgr0
endef
