Development Guide
=================

.. warning:: This documentation is work in progress, and subject to change!

In order to open a shell to a pod in the cluster, see ``make open-shell`` (in ``kubernetes/Makefile``)

Running a service locally
-------------------------

During development, it is sometimes cumbersome to deploy a new build for every minor change, and running a service locally can speed up the development process. This can be achieved in three steps:

#. Start the service locally on the host. You might need to expose the same environment variables as in k8s, and also copy files such as keys depending on the service you are working on.
#. Make other service accessible on the host by running ``kubefwd`` as describe in :ref:`ExposeLocally`.
#. Make your service accessible to other services by running ``python3 kubernetes/util/proxy_service_to_localhost.py YOUR_SERVICE_NAME``.

.. warning:: For historical reasons, the frontend service is still named dashboard. However, this is due to change soon.

Running tests
-------------
Final tests should be run in the cluster. See ``kubernetes/util/import-images.sh`` to use your new image without having to push it to a docker repository. Afterwards, you can run ``make test`` from the ``kubernetes`` directory.

.. hint:: Be careful about the Kubernetes pull policy. If you are working with the latest tag, Kubernetes will try to pull the image even if it is already imported into the cluster. See `this <https://kubernetes.io/docs/concepts/containers/images/>`_ for details.
.. hint:: Tests won't run if the ``DOCKERUSER`` and ``DOCKERPASS`` variables are not exposed. If you do not need to pull any images (because you have imported them all), export dummy values for these variables. This is also a good way to make sure you are not accidentally working with the images from the repository.
