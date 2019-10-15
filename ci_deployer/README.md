This folder contains a Docker image that can be used by CircleCI to deploy OISP on a K8s cluster. The cluster must fulfill the documented requirements such as a volume provisioner and the `minio` operator running.

In order to build the image, a `kubeconfig` file must be copied into this directory.
