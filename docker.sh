#!/bin/bash

# Set env for application
. ./setup-environment.sh

redsocks_container_name='redsocks'

if [ -n "$http_proxy" ] && [ -n "$https_proxy" ] && [ "$1" == "up" ]; then
	# Run redsocks to allow containers to use proxy

	
	if ! [[ $(docker ps -f "name=$redsocks_container_name" --format '{{.Names}}') == $redsocks_container_name ]]; then
		echo "Starting redsocks..."

		docker run -d --net=host --privileged --name $redsocks_container_name --rm -e http_proxy=$http_proxy -e https_proxy=$https_proxy klabs/forgetproxy
		echo
	fi
fi

docker-compose $*

if [ "$1" == "stop" ]; then
	if [[ $(docker ps -f "name=$redsocks_container_name" --format '{{.Names}}') == $redsocks_container_name ]]; then
		docker stop $redsocks_container_name
	fi
fi
