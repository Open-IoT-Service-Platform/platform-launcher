#
# Copyright (c) 2020 Intel Corporation
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
ARG DOCKER_TAG
FROM openjdk:8-jdk

ENV KAIROSDB_VERSION 1.2.2

ENV JAVA_HOME /usr/local/openjdk-8

RUN apt-get update && apt-get install -y --no-install-recommends wget jq
RUN cd /opt && \
    wget -qO- https://github.com/kairosdb/kairosdb/releases/download/v${KAIROSDB_VERSION}/kairosdb-${KAIROSDB_VERSION}-1.tar.gz | tar xz

RUN groupadd -r kairosdb && useradd -r -g kairosdb kairosdb

RUN chown -R kairosdb:kairosdb /opt && chown -R kairosdb:kairosdb /var

ADD scripts/kairosdb-startup.sh /opt/kairosdb-startup.sh
ADD scripts/wait-for-it.sh /opt/wait-for-it.sh

USER kairosdb

EXPOSE 8080
