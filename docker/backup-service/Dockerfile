FROM alpine:3.13.0

ARG gittag

RUN apk update && apk upgrade
RUN apk add --update make curl git bash ncurses jq py-pip coreutils
RUN pip install shyaml s3cmd

# Install kubectl
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

RUN adduser -D backupuser


USER backupuser

RUN cd /home/backupuser/ && git clone https://github.com/Open-IoT-Service-Platform/platform-launcher.git

WORKDIR /home/backupuser/platform-launcher

CMD ["tail", "-f", "/dev/null"]
