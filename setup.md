# OISP Development Setup

For installation on Ubuntu 18.04 LTS, the `setup-ubuntu18.04.sh` script should be used.

## Prerequisites
git, make, docker and docker-compose

## Install kubectl
TODO

## K3s
Install [K3s](https://k3s.io/) as described [here](https://medium.com/okteto/lightweight-kubernetes-development-with-k3s-and-okteto-4be08de516a).

Installation:
```bash
$ curl https://raw.githubusercontent.com/rancher/k3s/master/docker-compose.yml > ~/k3s/docker-compose.yml
$ cd ~/k3s
$ docker-compose up -d
```

A `kubeconfig.yaml` is created in the directory. Copy it to `~/.kube/config`, **make a backup of the old config file if overwriting, alternatively, use the --kubeconfig flag in every kubectl command.**
```bash
$ cp kubeconfig.yaml ~/.kube/config
```

Verify the installation:
```bash
$ kubectl cluster-info
$ kubectl get nodes
```
You should see the master running on localhost, and a worker node.

### Enable PVC
oisp uses PVCs (persistent volume claims) for storage. k3s does not support PVCs out of the box,
but the Rancher volume provisioner can be added easily:

```bash
$ kubectl apply -f https://gist.githubusercontent.com/rberrelleza/58705b20fa69836035cf11bd65d9fc65/raw/bf479a97e2a2da7ba69d909db5facc23cc98942c/local-path-storage.yaml
$ kubectl get storageclass # check the installation
```

## OISP
Get the oisp-k8s repo:
```bash
$ git clone https://github.com/Open-IoT-Service-Platform/oisp-k8s.git
$ export DOCKERUSER=username
$ export DOCKERPASS=mypass # better use the read command, otherwise password in plaintext goes into shell history
$ make deploy-oisp-test
$ make wait-until-ready # or: watch (kubectl -n oisp get pods)
```