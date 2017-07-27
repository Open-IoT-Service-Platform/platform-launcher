
#----------------------------------------------------------------------------------------------------------------------
# targets
#----------------------------------------------------------------------------------------------------------------------

.init:
	@$(call msg,"Initializing ..."); 
	git submodule init
	git submodule update --remote --merge
	cp setup-environment.example.sh setup-environment.sh
	sudo usermod -aG docker ${USER}
	@touch $@

build: .init
	@$(call msg,"Building IoT connector ..."); 
	@/bin/bash -c "./docker.sh create "


build-force: .init
	@$(call msg,"Building IoT connector ..."); 
	@/bin/bash -c "./docker.sh create --force-recreate "

start: build
	@$(call msg,"Starting IoT connector ..."); 
	@/bin/bash -c "./docker.sh start "

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