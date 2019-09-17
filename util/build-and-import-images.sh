#! /bin/bash

BRANCH=${BRANCH:-develop}
export TEST=1

cd /tmp
rm -rf platform-launcher/
git clone https://github.com/Open-IoT-Service-Platform/platform-launcher.git -b $BRANCH
cd platform-launcher
git submodule update
make update
printf "n\ny\ny\n" | make build DEBUG=true
/bin/bash import-images.sh
