#!/bin/bash

# Set env for application
. ./setup-environment.sh

if [ -n "$http_proxy" ] && [ -n "$https_proxy" ]; then
	# Run redsocks to allow containers to use proxy
	echo "Starting redsocks..."
	docker run -d --net=host --privileged -e http_proxy=$http_proxy -e https_proxy=$https_proxy klabs/forgetproxy
	echo
fi

# Start containers
docker-compose $*

