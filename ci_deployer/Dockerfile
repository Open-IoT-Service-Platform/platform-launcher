FROM alpine

RUN apk add --update make curl git bash ncurses
WORKDIR /home

# Install kubectl
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

# Install helm
RUN curl -o helm-v2.14.3-linux-amd64.tar.gz https://get.helm.sh/helm-v2.14.3-linux-amd64.tar.gz  && \
    tar -xzvf helm-v2.14.3-linux-amd64.tar.gz && \
    mv linux-amd64/* /usr/bin/ && \
    chmod +x /usr/bin/helm

RUN addgroup -S deployer && adduser -S deployer -G deployer -h /home/deployer/
USER deployer
WORKDIR /home/deployer
ADD kubeconfig /home/deployer/.kube/config
ADD deploy.sh /home/deployer/deploy.sh