#
# Copyright (c) 2018 Intel Corporation
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
FROM oisp/hbase:${DOCKER_TAG}

# avoid debconf and initrd
ENV DEBIAN_FRONTEND noninteractive
ENV INITRD No

ENV OPENTSDB_VERSION 2.3.1

ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64

RUN apt-get update && apt-get install -y --no-install-recommends wget jq supervisor openjdk-8-jdk-headless  \
    dh-autoreconf gnuplot gnuplot-x11 libgd2-xpm-dev libgd3
RUN echo https://github.com/OpenTSDB/opentsdb/releases/download/v${OPENTSDB_VERSION}/opentsdb-${OPENTSDB_VERSION}.tar.gz
RUN cd /opt && \
    wget -q  https://github.com/OpenTSDB/opentsdb/releases/download/v${OPENTSDB_VERSION}/opentsdb-${OPENTSDB_VERSION}.tar.gz && \
    tar xzf opentsdb-${OPENTSDB_VERSION}.tar.gz && \
    mv opentsdb-${OPENTSDB_VERSION} /opt/opentsdb
RUN cd /opt/opentsdb && ./bootstrap && ./configure --prefix=/usr && make install
ADD ./scripts/* /opt/
ADD ./conf/hbase-site.xml /opt/hbase/conf/
RUN chmod 550 /opt/*.sh

EXPOSE 4242
