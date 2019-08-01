echo "\033[1mInstalling docker"
echo "-----------------\033[0m"
sudo apt -qq update
sudo apt -qq install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
echo "\033[1mSuccessfully installed" $(docker --version) "\033[0m"
echo ""

echo "\033[1mInstalling docker-compose"
echo "-------------------------\033[0m"
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker $USER
echo "\033[1mSuccessfully installed" $(docker-compose --version) "\033[0m"
echo ""

echo "\033[1mInstalling kubectl"
echo "------------------\033[0m"
sudo snap install kubectl --classic
if [ ! -d ~/.kube ]; then
      mkdir ~/.kube
fi
echo "\033[1mSuccessfully installed kubectl\033[0m"
export PATH=$PATH:/snap/bin
kubectl version --short
echo ""

echo "\033[1mStarting k3s"
echo "--------------\033[0m"
rm -rf ~/k3s
mkdir ~/k3s
curl https://raw.githubusercontent.com/rancher/k3s/master/docker-compose.yml > ~/k3s/docker-compose.yml
# Compose down is necessary for subsequent runs to succeed
cd ~/k3s && sudo docker-compose down -v && sudo docker-compose up -d
echo "Waiting for k3s to create kubeconfig file"
while [ ! -f ~/k3s/kubeconfig.yaml ]
do
  sleep 1
done
if [ -f ~/.kube/config ]; then
   echo "Backing-up old config in ~/.kube/config_beforeoisp.bak"
   mv ~/.kube/config ~/.kube/config_beforeoisp.bak
fi
cp ~/k3s/kubeconfig.yaml ~/.kube/config
sleep 5
echo "\033[1mKubernetes cluster started\033[0m"
kubectl cluster-info
echo ""
echo "\033[1mEnabling PVCs\033[0m"
kubectl apply -f https://gist.githubusercontent.com/rberrelleza/58705b20fa69836035cf11bd65d9fc65/raw/bf479a97e2a2da7ba69d909db5facc23cc98942c/local-path-storage.yaml
echo "\033[1mGot storage classes:\033[0m"
kubectl get storageclass
echo ""

echo "\033[1mInstalling helm"
echo "---------------\033[0m"
sudo snap install helm --classic

kubectl -n kube-system create serviceaccount tiller
kubectl create clusterrolebinding tiller --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
helm init --service-account tiller --wait
echo "\033[1mHelm initiated succesfully.\033[0m"

echo ""
echo "\033[1mInstalling k8s operators"
echo "------------------------\033[0m"
kubectl create -f https://github.com/minio/minio-operator/blob/master/docs/minio-operator.yaml?raw=true --validate=false
echo "\033[1mOperators installed successfully.\033[0m"

echo ""
echo "\033[1mInstalling test dependencies"
echo "----------------------------\033[0m"
sudo apt -qq install nodejs npm
sudo npm install -g n
sudo n 8
sudo npm install -g nodemailer
sleep 3
echo "\033[1mReady to deploy OISP\033[0m"
