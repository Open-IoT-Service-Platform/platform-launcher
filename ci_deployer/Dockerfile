FROM alpine

RUN apk add --update make curl git bash ncurses jq py-pip openssl
RUN pip install shyaml
WORKDIR /home

# Install kubectl
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

# Install helm
RUN curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash

RUN addgroup -S deployer && adduser -S deployer -G deployer -h /home/deployer/
USER deployer
WORKDIR /home/deployer
ADD kubeconfig /home/deployer/.kube/config
ADD deploy.sh /home/deployer/deploy.sh