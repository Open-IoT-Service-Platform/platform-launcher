Getting Started
===============

Open IoT Software platform (OISP) is an `open source <https://github.com/Open-IoT-Service-Platform/platform-launcher/>`_ framework for IoT services that runs on Kubernetes. Start by cloning the repo **and checking out the develop branch**. This documentation assumes you are running an Ubuntu system (preferably 18.04 LTS), but other Linux distributions should also work with minor modifications.

.. note:: Most of the functionality described in this documentation is packed into the ``Makefile`` in the project root. Run ``make help`` for a list of available commands with descriptions.

Running OISP
--------------
OISP can be deployed on any Kubernetes cluster that has Helm installed, a volume provisioner and an ingress controller. For development purposes, we recommend a local installation based on `k3s <https://k3s.io/>`_, as described in `Creating a lightweight local kubernetes cluster`_.

If you wish to deploy on an external cluster, make sure the following conditions are met:

1. Your host is configured to manage the cluster, meaning the default kubeconfig file is at ``~/.kube/config``.
2. Helm and kubectl are installed on the client and cluster.
3. The cluster has an Ingress controller and a volume provisioner configured.
4. The `minio operator <https://github.com/minio/minio-operator>`_ is installed in the cluster.


Creating a lightweight local kubernetes cluster
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Run the following commands from the repository root to create a local k3s cluster on an Ubuntu 18.04 host:

.. code-block:: bash

  cd kubernetes/util
  sh setup-ubuntu-18.04.sh

.. note:: The script should also run on Ubuntu 16.04 LTS, but you might need to ``export PATH=$PATH:/snap/bin`` first. On other Linux distributions, please install the snap packages in the script manually, and run the script afterwards.

The cluster is created in two Docker containers, one for the master and one for the worker. If you like, you can modify the script to make k3s run on bare metal instead of Docker, but the containerized setup is recommended, to avoid issues like port clashes.

If you need to recreate the cluster, simply run ``make restart-cluster``.

.. warning:: Both scripts are going to replace your ``~/.kube/kubeconfig`` file!

Deployment
~~~~~~~~~~
If you have access to the OISP dockerhub repository, export your user credentials to your shell:

.. code-block:: bash

  export DOCKERUSER=[YOURUSERNAME]
  read -s DOCKERPASS # type your password and press enter
  export DOCKERPASS

Otherwise, you will have to build the images yourself. Go to the project root and run ``make update && make build``.
You can specify a docker tag for the images being built. Run ``make help`` for more details. Afterwards, you have two options to get the images inside the cluster:

1. Run ``make import-images``, which also takes the ``DOCKER_TAG`` and ``DEBUG`` parameter, of which the later has to be set to ``true`` in order to run tests.
2. *OR* push the images to another repo, and adapt the ``imageCredentials`` section in ``kubernetes/values.yaml``. You will also need to export your credentials to your shell as described before.

Finally, adapt the ``kubernetes/values.yaml`` to fit your needs and run ``make deploy-oisp``.

.. note:: If you wish to run tests, or have a debugger container inside the cluster with useful tools, run ``make deploy-oisp-test``, which requires you to also build with ``make build DEBUG=true`` from the repository root.

.. hint:: You can watch the deployment process by running ``watch kubectl -n oisp get pods``, or programmatically wait until the system is up and running by using the command ``make wait-until-ready``.

Running end to end tests
~~~~~~~~~~~~~~~~~~~~~~~~
If you have deployed with ``make deploy-oisp-test``, you can run ``make test`` to make sure everything is working. The tests should take about 3-4 minutes to complete, *after the system is up and running*.

Using OISP
----------
You need a user account to interact with most of the API functionality. You can create a test user by running ``make add-test-user``. The username is ``user1@example.com`` and the password is simply ``password``.

.. _ExposeLocally:

Exposing OISP locally without ingresses
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
In a production environment, OISP should be exposed using Kubernetes ingresses. However, you might want to skip the configuration for local development purposes. It might also be useful to expose services which are not otherwise publicly accessible. You achieve this using `kubefwd <https://github.com/txn2/kubefwd>`_.

.. code-block:: bash

  sudo kubefwd services -n oisp --kubeconfig=/home/[YOUR_USERNAME]/.kube/config

Interacting with OISP
~~~~~~~~~~~~~~~~~~~~~

You can interact with OISP using the `REST API <https://streammyiot.com/ui/public/api.html>`_, or with our SDKs for `javascript <https://github.com/Open-IoT-Service-Platform/oisp-sdk-js>`_ and `python <https://github.com/Open-IoT-Service-Platform/oisp-sdk-python>`_.

.. warning:: Using the SDKs is the recommended way of interacting with the platform, however, they might not be always up to date with the latest features. Please feel welcome to open issues for any incompatibility problems between the API and the SDKs.


Deploying IoT-Agent with test sensor
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The folder ``./kubernetes/iot-agent`` contains an example on how to deploy the oisp-iot-agent
with Kubernetes. Once there is a running OISP instance, you can create a test user and deploy the agent by

1. Run ``make add-test-user`` to create a user in OISP.
2. Create or pull containers oisp-testsensor and oisp-iot-agent.
3. Import agent images ``make import-images-agent`` to import the images to k3s.
4. Login with the user to the OISP service, create an account and take the activation code from the account main page.
5. Copy the activation code to ``./kubernetes/iot-agent/global-config/activation-code``
6. Update the urls in ``./kubernetes/iot-agent/global-config/config.json``
7. Create the global configmap and secrets by ``(cd ./kubernetes/iot-agent/global-config; sh ./create.sh``
8. Go to the testsensor directory ``cd ./kubernetes/iot-agent/deploy-testsensor``
9. To create instance ``n`` on node ``node`` apply the script as follows ``sh ./create node n``
10. Apply the instance with ``kubectl apply -f node-n/all.yaml``


Cert-Manager
------------

OISP is prepared to be used with cert-manager to retrieve and update certificates from letsencrypt.
To configure the cert-manager:

1. Install cert-manager as described `here <https://docs.cert-manager.io/en/release-0.11/getting-started/install/kubernetes.html>`_ .
2. Install issuer `kubectl apply -f kubernetes/cert-manager/clusterissuer-prod.yaml`. Note that it is managing certificcates cluster wide and thus does not have a namespace.
3. Adapt email address in  `kubernetes/certificate_web_prod.yaml`. Install the certificate in namespace oisp: `kubectl apply -f kubernetes/certificate_web_prod.yaml -n oisp`
