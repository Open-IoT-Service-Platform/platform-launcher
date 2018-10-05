FROM ubuntu:xenial

RUN apt-get update && apt-get -y install nano make git kafkacat python python-pip python3-pip python3-dev python3-setuptools python-setuptools build-essential nodejs dnsutils virtualenv snapd npm wget apt-transport-https curl

# install kubectl
RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
RUN touch /etc/apt/sources.list.d/kubernetes.list
RUN echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl

RUN npm install --global n
RUN n 6

RUN ln -s /usr/bin/nodejs /usr/bin/node

ENV OISP_REMOTE https://github.com/Open-IoT-Service-Platform/platform-launcher.git

RUN mkdir /home/platform-launcher

WORKDIR /home/platform-launcher

CMD ["tail", "-f", "/dev/null"]