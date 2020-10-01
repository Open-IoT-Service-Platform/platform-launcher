printf "\033[1mInstalling docker\n"
printf -- "-----------------\033[0m\n"
sudo apt -qq update
sudo apt -qq install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
printf "\033[1mSuccessfully installed %s\033[0m\n" "$(docker --version)"
printf "\n"

printf "\033[1mInstalling docker-compose\n"
printf -- "-------------------------\033[0m\n"
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker $USER
printf "\033[1mSuccessfully installed %s \033[0m\n" "$(docker-compose --version)"
printf "\n"

printf "\033[1mInstalling kubectl\n"
printf -- "------------------\033[0m\n"
#sudo snap install kubectl --classic
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.19.0/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/bin/kubectl
if [ ! -d ~/.kube ]; then
      mkdir ~/.kube
fi
printf "\033[1mSuccessfully installed kubectl\033[0m\n"
export PATH=$PATH:/snap/bin
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
sudo apt -qq install nodejs npm make git
sudo npm install -g n
sudo n 8
sudo npm install -g nodemailer
sleep 3

./restart-cluster.sh
