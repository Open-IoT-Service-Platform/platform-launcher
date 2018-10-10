# Locust Chart for Helm

[Locust.io](https://locust.io/) is an open-source load testing framework. This directory contains a helm chart for deploying a locust cluster to run test on a oisp cluster.

## Running tests

### Step 1 - Configure values

Edit `values.yaml` to enter your docker credentials, and update oisp.url if necessary.

If you do not want to save those in a file (for example because you are checking it in), those can be passed to helm like `[helm command] --set oisp.url="http://example.com"`

### Step 2 - Write the locustfile

Edit `locustfile.py` to customize your test. The official locust.io page is a good place to get started.

### Step 3 - Make sure the cluster is ready

If so, you might need to kill it. This README assumes the platform is running in the `oisp` namespace, and locust is deployed in the `locust` namespace, so first make sure `oisp` is running, then stop locust, just in case.

```
helm del --purge locust
kubectl delete namespace locust --wait
```

### Step 4 - Install the helm chart

Run `helm install --name locust --namespace locust .` Locust will come up automatically.

### Step 5 - Run the test

If you have the ingress configured correctly, go to locust dashbord using the url, otherwise run `kubeproxy` and `kubectl -n port-forward locust-master-xxxx 8089:8089` and go to `localhost:8089`

Wait for slave to connect and start the test.
