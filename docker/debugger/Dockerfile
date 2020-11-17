FROM ubuntu:18.04

RUN apt-get update && apt-get -y install nano make git kafkacat python python-pip python3-pip python3-dev python3-setuptools ipython3 python-setuptools build-essential nodejs dnsutils virtualenv snapd npm wget apt-transport-https curl apache2-utils imagemagick gettext-base jq nginx

# install kubectl
RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
RUN touch /etc/apt/sources.list.d/kubernetes.list
RUN echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update
RUN apt-get install -y kubectl

RUN npm install --global n
RUN n 10.21.0

RUN pip3 install locust oisp shyaml
RUN npm install -g fake-smtp-server

ENV OISP_REMOTE https://github.com/Open-IoT-Service-Platform/platform-launcher.git

RUN mkdir /home/platform-launcher
RUN wget https://github.com/tsenart/vegeta/releases/download/cli%2Fv12.1.0/vegeta-12.1.0-linux-amd64.tar.gz && \
    tar -xzvf vegeta-12.1.0-linux-amd64.tar.gz && \
    cp vegeta /usr/bin/vegeta

RUN mkdir /home/load-tests/
ADD load-tests/create_test.py /home/load-tests/create_test.py

WORKDIR /home/platform-launcher

EXPOSE 8089 5557 5558 80

CMD ["tail", "-f", "/dev/null"]
