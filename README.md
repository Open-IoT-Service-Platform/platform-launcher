
# Open IoT Service Platform (OISP)

This project is designed to provide Cloud Service Providers with a platform for enabling and supporting IoT developers to create IoT solutions with both edge devices and the cloud.

The platform provides developers with an end-to-end solution for streaming telemetry data to the cloud, applying rules (using the rules engine) to this data, triggering actuations whilst also providing an interface for the platform to communicate with your own cloud services.

Key features:

 * Easy to use and deploy IoT agent
 * Inbuilt dashboard to create rules, graphs and catalog items
 * Full RESTful JSON API supported
 * Realtime actuations (cloud -> IoT device)

## Getting started with OISP

The platform consists of multiple components (services) each designed and optimised for a specific usecase. For example, the rules engine runs seperately to the rest of the system and ingests telemetry data from a Kafka queue.

Please check the [documentation](https://platform-launcher.readthedocs.io/en/latest/) for instruction on getting started.

The project has been structured using Git submodules according to recommendations made here: https://www.philosophicalhacker.com/post/using-git-submodules-effectively/


## Development

### Development Process
Community contributions are welcome!
All PRs have to be applied to the develop branches in the ``platform-launcher`` repository or the sub repositories. At least one review and approval of a project admin is needed to merge it in.
Before submitting a PRs make sure that you checked out the most recent develop state.
The master branches are only getting PRs from the respective develop branches.

An additinal [development guide](https://platform-launcher.readthedocs.io/en/latest/development/developers_guide.html) contains tips and tricks to ease the development process.

## Install from v2.2-branch

### Install helm with MQTT TCP Service

``helm install ingress-nginx ingress-nginx/ingress-nginx --set tcp.8883="emqx-headless:8883" -n ingress-nginx``

Check the ``EXTERNAL-IP`` field of your cloud load-balancer:

``kubectl -n ingress-nginx get svc/ingress-nginx-controller``

Make sure that you have registered a <domain-name> for this external IP, e.g. ``mydomain.org``. **This is important** for the cert-manager later to get the certificate and to bring up the whole platform. Without a properly mapping of domainname to external IP, the platform will **not** come up properly.

### Install OISP branch

Create install script ``deploy.sh`` with your email and hostname:

```
export NAMESPACE=oisp
export DOCKER_TAG=v2.2-beta.2
export HELM_ARGS="--set less_resources=\"false\" \
                  --set production=\"true\" \
                  --set certmanager.email=\"<my-email>\" \
                  --set hosts.frontend=\"<domain-name as defined above>\""
make deploy-oisp

```

configure your docker-credentials and deploy:

```
export DOCKERUSER=<user>
read -s DOCKERPASS
export DOCKERPASS
bash ./deploy.sh
```
