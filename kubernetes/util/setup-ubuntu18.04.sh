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
sudo snap install kubectl --classic
if [ ! -d ~/.kube ]; then
      mkdir ~/.kube
fi
printf "\033[1mSuccessfully installed kubectl\033[0m\n"
export PATH=$PATH:/snap/bin
kubectl version --short
printf "\n"

printf "\033[1mInstalling test dependencies\n"
printf -- "----------------------------\033[0m\n"
sudo apt -qq install nodejs npm
sudo npm install -g n
sudo n 8
sudo npm install -g nodemailer
sleep 3

./restart-cluster.sh
