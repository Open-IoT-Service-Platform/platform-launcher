Development Guide
=================

.. warning:: This documentation is work in progress, and subject to change!

In order to open a shell to a pod in the cluster, see ``make open-shell``.

Running a service locally
-------------------------

During development, it is sometimes cumbersome to deploy a new build for every minor change, and running a service locally can speed up the development process. This can be achieved in three steps:

#. Start the service locally on the host. You might need to expose the same environment variables as in k8s, and also copy files such as keys depending on the service you are working on.
#. Make your service accessible to other services by running ``python3 util/proxy_service_to_localhost.py YOUR_SERVICE_NAME``.
#. Make other service accessible on the host by running ``kubefwd`` as described in :ref:`ExposeLocally`.
#. Start the desired service in your local environment.

Example: Running dashboard(frontend) service locally
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

#. Prepare a fresh terminal for the local service and copy the keys:

.. code-block:: bash

    nvm use 8
    source <(./platform-launcher/util/get_oisp_container_config.sh oisp dashboard)
    kubectl -n oisp cp dashboard-855957b8f8-8hr4h:/app/keys ./platform-launcher/oisp-frontend/public-interface

.. warning:: The used NodeJS version, paths, kubernetes namespace and the pod name are just an example and should be changed accordingly. For information on the helper script 'get_oisp_container_config.sh', use it with '-h' argument.

#. In a new terminal, make your service accessible to other services and make other services accessible to dashboard.

.. code-block:: bash

    python3 ./platform-launcher/util/proxy_service_to_localhost.py dashboard
    sudo kubefwd services --kubeconfig=/home/username/.kube/config -n oisp

#. Start your service locally in the fresh prepared terminal.

.. code-block:: bash

    node app.js

.. warning:: If you want to run multiple services locally, the steps are similar. Make sure but then that the environment variables are right. For example, if you are running frontend and websocket server together, then you should change the websocket server host in the frontend to localhost, as it will not be accessible via the host 'websocket-server' anymore.

Running tests
-------------
Final tests should be run in the cluster. See ``make import-images`` to use your new image without having to push it to a docker repository. Afterwards, you can run ``make test`` from the ``kubernetes`` directory. If you want to use the latest images for the other components, you will need to edit ``kubernetes/templates/[YOUR_SERVICE].yaml`` to use the image tag of your choice instead of the value provided by ``{{ .Values.tag }}``.

.. hint:: Be careful about the Kubernetes pull policy. If you are working with the latest tag, Kubernetes will try to pull the image even if it is already imported into the cluster. See `this <https://kubernetes.io/docs/concepts/containers/images/>`_ for details.
.. hint:: Tests won't run if the ``DOCKERUSER`` and ``DOCKERPASS`` variables are not exposed. If you do not need to pull any images, set an environment variable to bypass the check by running ``export NODOCKERLOGIN=true``. This is also a good way to make sure you are not accidentally working with the images from the repository.

Testing the ingresses
---------------------

If you want to test the ingresses itself, you should add the hostname of the ingress to your /etc/hosts file:

.. code-block:: bash

    ~>>> kubectl -n oisp get ingresses
    NAME                 HOSTS                                                                     ADDRESS      PORTS     AGE
    dashboard-web        latest.streammyiot.com,latest.streammyiot.com,ws.latest.streammyiot.com                80, 443   75m
    dashboard-web-http   latest.streammyiot.com,latest.streammyiot.com,ws.latest.streammyiot.com   172.18.0.2   80        75m
    mqtt                 mqtt.latest.streammyiot.com                                               172.18.0.2   80        75m

Then you will add an entry to your /etc/hosts file like this:

.. code-block:: bash

    172.18.0.2          latest.streammyiot.com ws.latest.streammyiot.com

.. warning:: If you are running a service locally that uses ingress, then remember ingress will not route a request to your local working service.
