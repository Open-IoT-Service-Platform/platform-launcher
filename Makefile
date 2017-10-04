
# Copyright (c) 2017, Intel Corporation

# Redistribution and use in source and binary forms, with or without modification,
# are permitted provided that the following conditions are met:

#     * Redistributions of source code must retain the above copyright notice,
#       this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above copyright notice,
#       this list of conditions and the following disclaimer in the documentation
#       and/or other materials provided with the distribution.

# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
# ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#----------------------------------------------------------------------------------------------------------------------
# targets
#----------------------------------------------------------------------------------------------------------------------

.init:
	@$(call msg,"Initializing ..."); 
	git submodule init
	git submodule update --remote --merge
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

.prepare:
	/bin/bash -c 'docker run -it -v ${PWD}/iotanalytics-dashboard:/app openiotconnector_dashboard /bin/bash -c \
	"/app/public-interface/scripts/docker-prepare.sh"'
	@touch $@

build-force: .init
	@$(call msg,"Building IoT connector ..."); 
	@/bin/bash -c "./docker.sh create --force-recreate "

start: build .prepare
	@$(call msg,"Starting IoT connector ..."); 
	@sudo /bin/bash -c "( (service --status-all | grep -q redis-server) && (systemctl stop redis-server) ) || true"
	@sudo /bin/bash -c "./docker.sh up -d"

stop: 
	@$(call msg,"Stopping IoT connector ..."); 
	@sudo /bin/bash -c "./docker.sh stop "

update:
	@$(call msg,"Git Update ..."); 
	@git pull
	@@git submodule update

clean:
	@$(call msg,"Cleaning ..."); 
	@rm -f .init .prepare

distclean: clean
	@/bin/bash -c "./docker.sh down "
	@rm -rf ./data


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
