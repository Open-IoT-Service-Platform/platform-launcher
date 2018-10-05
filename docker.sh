#!/bin/bash
#
# Copyright (c) 2017 Intel Corporation
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
#
# Set env for application
. ./setup-environment.sh

export GIT_COMMIT_PLATFORM_LAUNCHER=$(git rev-parse HEAD)
export GIT_COMMIT_FRONTEND=$(git -C oisp-frontend rev-parse HEAD)
export GIT_COMMIT_GEARPUMP=$(git -C oisp-gearpump-rule-engine rev-parse HEAD)
export GIT_COMMIT_WEBSOCKET_SERVER=$(git -C oisp-websocket-server rev-parse HEAD)
export GIT_COMMIT_BACKEND=$(git -C oisp-backend rev-parse HEAD)

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
