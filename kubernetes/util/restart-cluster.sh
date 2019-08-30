printf "\033[1mStarting k3s\n"
printf -- "------------\033[0m\n"
rm -rf ~/k3s
mkdir ~/k3s
curl https://raw.githubusercontent.com/rancher/k3s/master/docker-compose.yml > ~/k3s/docker-compose.yml
# Compose down is necessary for subsequent runs to succeed
cd ~/k3s && sudo docker-compose down -v && sudo docker-compose up -d
printf "Waiting for k3s to create kubeconfig file\n"
while [ ! -f ~/k3s/kubeconfig.yaml ]
do
  sleep 1
done
if [ -f ~/.kube/config ]; then
   printf "Backing-up old config in ~/.kube/config_beforeoisp.bak\n"
   mv ~/.kube/config ~/.kube/config_beforeoisp.bak
fi
cp ~/k3s/kubeconfig.yaml ~/.kube/config
sleep 5
printf "\033[1mKubernetes cluster started\033[0m\n"
kubectl cluster-info
printf ""
printf "\033[1mEnabling PVCs\033[0m\n"
kubectl apply -f https://gist.githubusercontent.com/rberrelleza/58705b20fa69836035cf11bd65d9fc65/raw/bf479a97e2a2da7ba69d909db5facc23cc98942c/local-path-storage.yaml
printf "\033[1mGot storage classes:\033[0m\n"
kubectl get storageclass
printf "\n"

printf "\033[1mInstalling helm\n"
printf -- "---------------\033[0m\n"
sudo snap install helm --classic

kubectl -n kube-system create serviceaccount tiller
kubectl create clusterrolebinding tiller --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
helm init --service-account tiller --wait
printf "\033[1mHelm initiated succesfully.\033[0m\n"

printf "\n"
printf "\033[1mInstalling k8s operators\n"
printf -- "------------------------\033[0m\n"
kubectl create -f https://github.com/minio/minio-operator/blob/master/minio-operator.yaml?raw=true --validate=false
printf -- "\033[1mOperators installed successfully.\033[0m\n"

printf "\033[1mReady to deploy OISP\033[0m\n"
