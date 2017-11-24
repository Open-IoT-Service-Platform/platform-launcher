#!/bin/bash

# Set env for application
. ./setup-environment.sh

if [ -n "$http_proxy" ] && [ -n "$https_proxy" ] && [ "$1" == "up" ]; then
	# Run redsocks to allow containers to use proxy

	container_name='redsocks'
	if ! [[ $(docker ps -f "name=$container_name" --format '{{.Names}}') == $container_name ]]; then
		echo "Starting redsocks..."

		docker run -d --net=host --privileged --name $container_name --rm -e http_proxy=$http_proxy -e https_proxy=$https_proxy klabs/forgetproxy
		echo
	fi
fi

# Start containers
docker-compose $*

