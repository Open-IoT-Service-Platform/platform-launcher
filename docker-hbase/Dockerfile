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

FROM ubuntu:xenial

# avoid debconf and initrd
ENV DEBIAN_FRONTEND noninteractive
ENV INITRD No

ENV HBASE_VERSION 1.2.4
ENV HBASE_DIST http://archive.apache.org/dist/hbase
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64

RUN apt-get update && apt-get upgrade -y && \
	apt-get install -y --no-install-recommends wget supervisor && \
	cd /opt && \
		wget -q  $HBASE_DIST/$HBASE_VERSION/hbase-$HBASE_VERSION-bin.tar.gz && \
			tar xzf hbase-$HBASE_VERSION-bin.tar.gz && \
		mv hbase-${HBASE_VERSION} hbase && \
	cd /opt/hbase && \
		rm -rf docs *.txt LEGAL && rm -f */*.cmd && \
		sed -i "s,^. export JAVA_HOME.*,export JAVA_HOME=$JAVA_HOME," conf/hbase-env.sh && \
		echo "export JAVA_HOME=$JAVA_HOME" > /etc/profile.d/defaults.sh && \
	apt-get install -y --no-install-recommends openjdk-8-jre-headless && \
	apt-get install -y openssh-server openssh-client && \
	apt-get clean  && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/*


VOLUME /data

ADD config/hbase-site.xml /opt/hbase/conf/

ADD config/zoo.cfg /opt/hbase/conf/

ADD scripts/replace-hostname.sh /opt/

ADD scripts/entrypoint.sh /opt/
ADD scripts/entrypoint-region.sh /opt/

ADD config/supervisor.conf /etc/supervisor/conf.d/

RUN mkdir -p /root/.ssh
RUN chmod 700 /root/.ssh
COPY id_rsa.pub /root/.ssh/id_rsa.pub
ADD id_rsa /root/.ssh/id_rsa
RUN ls -la /root/.ssh
RUN cat /root/.ssh/id_rsa.pub > /root/.ssh/authorized_keys
RUN chmod 600 /root/.ssh/authorized_keys
RUN chmod 600 /root/.ssh/id_rsa

RUN sed -i 's/#   StrictHostKeyChecking ask/   StrictHostKeyChecking no/' /etc/ssh/ssh_config

ADD scripts/wait-for-it.sh /opt/
# REST API
EXPOSE 8080
# REST Web UI at :8085/rest.jsp
EXPOSE 8085
# Thrift API
EXPOSE 9090
# Thrift Web UI at :9095/thrift.jsp
EXPOSE 9095
# HBase's Embedded zookeeper cluster
EXPOSE 2181
# HBase Master web UI at :16010/master-status;  ZK at :16010/zk.jsp
EXPOSE 16010

#ENTRYPOINT ["/opt/entrypoint.sh"]
