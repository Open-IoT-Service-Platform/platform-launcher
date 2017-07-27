
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

docker: .init
	@$(call msg,"Starting IoT connector ..."); 
	@/bin/bash -c "./docker.sh"


update:
	@$(call msg,"Git Update ..."); 
	@git pull
	@@git submodule update

clean:
	@rm -f .init

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