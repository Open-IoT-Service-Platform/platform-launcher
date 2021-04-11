printf "\033[1mInstalling docker\n"
printf -- "-----------------\033[0m\n"
sudo apt -qq update
sudo apt-get -qq install apt-transport-https ca-certificates curl gnupg-agent software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt -qq update
sudo apt-get install -y docker-ce=5:19.03.15~3-0~ubuntu-$(lsb_release -cs) docker-ce-cli=5:19.03.15~3-0~ubuntu-$(lsb_release -cs) containerd.io
printf "\033[1mSuccessfully installed %s\033[0m\n" "$(docker --version)"
printf "\n"

printf "\033[1mInstalling k3d\n"
printf -- "-----------------\033[0m\n"
curl -s https://raw.githubusercontent.com/rancher/k3d/main/install.sh | bash
printf "\033[1mSuccessfully installed %s\033[0m\n" "$(k3d --version)"
printf "\n"

printf "\033[1mInstalling k3d docker repo\n"
printf -- "-----------------------\033[0m\n"
k3d registry create oisp.localhost -p 12345
echo "Adding to /etc/hosts:"
echo "" | sudo tee -a /etc/hosts
echo "127.0.0.1 k3d-oisp.localhost" | sudo tee -a /etc/hosts


printf "\033[1mInstalling kubectl\n"
printf -- "------------------\033[0m\n"
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.19.0/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/bin/kubectl
if [ ! -d ~/.kube ]; then
      mkdir ~/.kube
fi
printf "\033[1mSuccessfully installed kubectl\033[0m\n"
kubectl version --short
printf "\n"

CURR_DIR=$(pwd)
printf "\033[1mInstalling helm\n"
printf -- "---------------\033[0m\n"
cd /tmp
wget https://get.helm.sh/helm-v3.0.0-linux-amd64.tar.gz
tar xf helm-v3.0.0-linux-amd64.tar.gz
sudo cp linux-amd64/helm /usr/bin/helm
printf "\033[1mHelm installed succesfully.\033[0m\n"
cd $CURR_DIR

printf "\033[1mInstalling test dependencies\n"
printf -- "----------------------------\033[0m\n"
sudo pip install shyaml
sudo apt -qq -y install nodejs npm make git
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.35.3/install.sh -o install_nvm.sh
bash install_nvm.sh
source ~/.profile
nvm install 10
sudo npm install -g nodemailer
sleep 3

printf "\033[1mInstalling S3 tools\n"
printf -- "----------------------------\033[0m\n"
sudo apt -qq install s3cmd

./restart-cluster.sh
