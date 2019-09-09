Getting Started
===============

.. warning:: This documentation is work in progress, and subject to change!

Open IoT Software platform (OISP) is an `open source <https://github.com/Open-IoT-Service-Platform/platform-launcher/>`_ framework for IoT services that runs on Kubernetes. Start by cloning the repo **and checking out the develop branch**.

Deploying OISP
--------------
OISP can be deployed on any Kubernetes cluster that has helm installed, a volume provisioner and an ingress controller. For development purposes, we recommend a local installation based on `k3s <https://k3s.io/>`_.

Creating a lightweight local kubernetes cluster
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Run the following commands from the repository root to create a local k3s cluster on an Ubuntu 18.04 host:

.. code-block:: bash

  cd kubernetes/util
  sh setup-ubuntu-18.04.sh

The cluster is created in two docker containers, one for the master and one for the worker. If you like, you can modify the script to make k3s run locally, but the containerized setup is recommended, to avoid issues like port clashes.

The setup script should be fairly easy to adapt on other distributions. If you want to restart the cluster and have a fresh start you can always run the ``restart-cluster.sh``, which creates a new cluster from scratch.

.. warning:: Both scripts are going to replace your ``~/.kube/kubeconfig`` file!

Preparing your system
~~~~~~~~~~~~~~~~~~~~~
If you have used the scripts to set up a local cluster, you are ready to go. Otherwise, follow these steps:
- Set ``kubectl`` to use the cluster you want to deploy on by default without passing the config file as an argument, by moving your kubeconfig to ``~/.kube/kubeconfig``.
- Install and configure `helm <https://helm.sh/>`_.

In order to run tests, your are also going to need ``nodejs`` and ``nodemailer`` installed.

Performing the deployment
~~~~~~~~~~~~~~~~~~~~~~~~~
If you have access to OISP dockerhub repository, export your user credentials to your shell:

.. code-block:: bash

  export DOCKERUSER={yourusername}
  read -s DOCKERPASS # enter your password and press enter

Otherwise, you will have to build the images yourself. Go to the project root and run ``make update && make build``. You can specify a docker tag for the images as well. Run ``make help`` for more details. Afterwards, you have two options to get the images inside the cluster:

1. Import the images using the `ìmport-images.sh` script found in ``kubernetes/import-images.sh``. You might need to change the ``DOCKER_TAG`` variable in the script.
2. *OR* push the images to another repo, and adapt the ``imageCredentials`` section in ``kubernetes/values.yaml``. You will also need to export your credentials to your shell as described before.

Finally, adapt the ``kubernetes/values.yaml`` to fit your needs, and run ``make deploy-oisp`` from the ``kubernetes`` directory.

.. note:: If you wish to run tests, or have a debugger container inside the cluster with useful tools, run ``make deploy-oisp-test``, which requires you to build with ``make build DEBUG=true`` from the repository root.

.. hint:: You can watch the deployment process by running ``watch kubectl -n oisp get pods``, or programmatically wait until the system is up and running by using the command ``make wait-until-ready`` from the ``kubernetes`` directory.

Running end to end tests
~~~~~~~~~~~~~~~~~~~~~~~~
If you have deployed with ``make deploy-oisp-test``, you can run ``make test`` from the ``kubernetes`` directory to make sure everything is working. The tests should take about 3-4 minutes to complete, *after the system is up and running*. Do not start the tests before ``make wait-until-ready`` terminates.

Using OISP
----------
You need a user account to interact with most of the API functionality. You can create a test user by running ``make add-test-user`` from the ``kubernetes`` directory. The username is ``user1@example.com`` and the password is simply ``password``.

.. _ExposeLocally:

Exposing OISP locally without ingresses
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
In a production environment, OISP should be exposed using Kubernetes ingresses. However, you might want to skip the configuration for local development purposes. It might also be useful to expose services which are not otherwise publicly accessible. You achieve this using `kubefwd <https://github.com/txn2/kubefwd>`_.

.. code-block:: bash

  kubefwd services -n oisp

Interacting with OISP
~~~~~~~~~~~~~~~~~~~~~

You can interact with OISP using the `REST API <https://streammyiot.com/ui/public/api.html>`_, or with our SDKs for `javascript <https://github.com/Open-IoT-Service-Platform/oisp-sdk-js>`_ and `python <https://github.com/Open-IoT-Service-Platform/oisp-sdk-python>`_.

.. warning:: Using the SDKs is the recommended way of interacting with the platform, however, they might not be always up to date with the latest features. Please feel welcome to open issues for any incompatibility problems between the API and the SDKs.
