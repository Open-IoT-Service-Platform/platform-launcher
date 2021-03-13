Upgrading OISP
==============

This document is currently work-in progres (WIP). It will include the necessary steps to update OISP fail-safe.

.. note:: Before any update, make sure you have a backup of the system, see :ref:`Backup`.


The recommended order to upgrade the platform is to

#. Upgrade the operators
#. Upgrade the Helm chart
#. Upgrade Keycloak manually (if need be)

Upgrade the Operators
---------------------

Since Helm does not (yet) provide a lifecycle management of CRDs (except installation), everything related to CRDs is managed by a sepatate script.
Taking the `platform-launcher` repository the script can be found here:
:file:`util/deploy_operators.sh`. The script assumes a properly set :code:`KUBECONFIG` environment variable:

.. code-block:: bash

  KUBECONFIG=<YOUR CONFIG> ./util/deploy_operators.sh

.. _section-upgrade-helm:

Upgrade the OISP Helm Chart
---------------------------

The `platform-launcher` repository contains the helm chart in the :file:`./kubernetes` directory. Helm should not be called directly but
from the Makefile targets since it is
executing additional tasks, e.g. auto-backups and copying over the secrets from the running helm chart.
It is recommended to create a script which contains the necessary steps and which calls then :code:`make upgrade-oisp`, for instance:

.. code-block:: bash

  export NAMESPACE=<YOUR_NAMESPACE>
  export KUBECONFIG=<YOUR_KUBECONIFG>
  export DOCKER_TAG=<YOUR_TAG>
  export HELM_ARGS="--set less_resources=\"false\" --set production=\"true\" "
  make upgrade-oisp

:code:`<YOUR_NAMESPACE>, <YOUR_KUBECONFIG>, <YOUR_TAG>` need to be replaced by actual values, e.g. :code:`export NAMESPACE=oisp` and
:code:`export DOCKER_TAG=v2.0.0-beta.1`. Save the script in file
:file:`upgrade-oisp.sh`. Before executing the script you need to have access to the `oisp` dockerhub repo and
make sure that you have exported :code:`DOCKERUSER` and :code:`DOCKERPASS` environment variables with the right credentials. Then execute the script with  :code:`sh ./upgrade-oisp.sh`.


Upgrading Keycloak manually
---------------------------

For the sake of simplicity, the upgrading should only be done when there is only one keycloak instance.

Upgrading Keycloak Version
~~~~~~~~~~~~~~~~~~~~~~~~~~

Official keycloak documentation recommends upgrading the version one at a time, meaning not to skip any major releases between the final and the current versions. This guarantees the correct migration of the configuration files. After each migration, the database of the keycloak should be exported and be replaced with the old configuration, so that keycloak can migrate the new configuration by next release upgrade. To export the current configuration keycloak offers argument variables which is stored in the keycloak-sh configmap.

.. code-block:: bash

  KUBE_EDITOR=<YOUR_TEXT_EDITOR> kubectl -n <NAMESPACE> edit configmaps keycloak-sh

The configmap should look like this

.. note:: The arguments are listed in the line that starts with command 'exec', at data['keycloak.sh']. The rest of the config should already be similar.


.. code-block:: yaml

  apiVersion: v1
  data:
    keycloak.sh: |
      #!/usr/bin/env bash

      set -o errexit
      set -o nounset

      exec /opt/jboss/tools/docker-entrypoint.sh -b 0.0.0.0 -Dkeycloak.profile.feature.token_exchange=enabled -Dkeycloak.profile.feature.admin_fine_grained_authz=enabled -Dkeycloak.profile.feature.upload_scripts=enabled -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/opt/jboss/keycloak/realms/<FILE TO EXPORT TO>
  kind: ConfigMap
  metadata:
    creationTimestamp: "2020-09-09T09:41:35Z"
    labels:
      app.kubernetes.io/instance: oisp
      app.kubernetes.io/managed-by: Helm
      app.kubernetes.io/name: keycloak
      helm.sh/chart: keycloak-6.0.4
    name: keycloak-sh
    namespace: oisp
    resourceVersion: "27384"
    selfLink: /api/v1/namespaces/oisp/configmaps/keycloak-sh
    uid: bbbc4f7d-8a9a-447e-85df-b796a893efd3

After keycloak finishes the export, you can get the copy of the current realm data:

.. code-block:: bash

  kubectl -n <NAMESPACE> cp <KEYCLOAK_POD_NAME>:/opt/jboss/keycloak/realms/<EXPORTED FILE> ./<DESTINATION>

The exported file contains realm configuration and users in the database. If you wish to use the configuration file as a template and seperate users from the realm configuration, you can adjust the argument variables. An example of export with users and realm configuration in seperate files is presented at :ref:`UpdatingKeycloakRealm` section.

.. _UpdatingKeycloakRealm:

Updating Keycloak Realm
~~~~~~~~~~~~~~~~~~~~~~~

Similar to the version upgrading, it is recommended that the user does not skip any major release for smooth migration.

The steps to update the keycloak realm are:

#. Export the current users and realm configuration in seperate files.
#. Overwrite the current configuration file with the new one.
#. Import users to the new configuration.

.. code-block:: bash

  KUBE_EDITOR=<YOUR_TEXT_EDITOR> kubectl -n <NAMESPACE> edit configmaps keycloak-sh


.. note:: The arguments are listed in the line that starts with command 'exec', at data['keycloak.sh']. The rest of the config should already be similar.


This time configmap should look like this:

.. code-block:: yaml

    apiVersion: v1
    data:
      keycloak.sh: |
        #!/usr/bin/env bash

        set -o errexit
        set -o nounset

        exec /opt/jboss/tools/docker-entrypoint.sh -b 0.0.0.0 -Dkeycloak.profile.feature.token_exchange=enabled -Dkeycloak.profile.feature.admin_fine_grained_authz=enabled -Dkeycloak.profile.feature.upload_scripts=enabled -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=dir -Dkeycloak.migration.dir=/opt/jboss/keycloak/realms -Dkeycloak.migration.userExportStrategy=SAME_FILE
    kind: ConfigMap
    metadata:
      creationTimestamp: "2020-09-09T09:41:35Z"
      labels:
        app.kubernetes.io/instance: oisp
        app.kubernetes.io/managed-by: Helm
        app.kubernetes.io/name: keycloak
        helm.sh/chart: keycloak-6.0.4
      name: keycloak-sh
      namespace: oisp
      resourceVersion: "27384"
      selfLink: /api/v1/namespaces/oisp/configmaps/keycloak-sh
      uid: bbbc4f7d-8a9a-447e-85df-b796a893efd3


.. note:: After changing the arguments for exporting, keycloak might not function properly (the server might not start). This behavior is not officially documented in the keycloak documentation but it is consistently observed. Do not forget to revert the arguments back after the process is completed, so the server can start.


With the SAME_FILE strategy, we get two confiugarition files, one of them only contains the users in the system. The other one contains the rest of the data.

If you want to use the realm configuration file as a template for future, there are some secret variables you have to adjust. These are usually the secrets of the clients and private/public keys that are used for encryption. All of the template variables in the configuration file follow the scheme '{{ INSERT-VARIABLE-NAME }}'. It is highly recommended to check `/platform-launcher/docker/keycloak/oisp-realm.json <https://github.com/Open-IoT-Service-Platform/platform-launcher/blob/develop/docker/keycloak/oisp-realm.json>`_ and `/platform-launcher/kubernetes/values.yaml keycloak section <https://github.com/Open-IoT-Service-Platform/platform-launcher/blob/8b84943c71bcae8ed03760a0f64cc762f285f2e9/kubernetes/values.yaml#L167>`_ to learn how to overwrite template variables during runtime.

There are two ways to import the exported realm configuration file:

* If there are no changes in the general realm configuration (e.g: event listeners, encryption algorithms) and the change does not bring major overwriting or deletion, you can try to import the configuration file directly through keycloak dashboard. For example, if the change is only a new client, you could select only import clients with the option of skipping existing clients. This method may not always work if the change is complex.
* Either prepare a template from the exported configuration file or put it directly into the keycloak container. Then, adjust the keycloak.sh arguments to make an import with overwriting enabled. This method requires more effort but it is guaranteed to work.

To overwrite the current configuration (the new configuration file is in the keycloak container at this stage), change again the keycloak-sh configmap:

.. note:: The arguments are listed in the line that starts with command 'exec', at data['keycloak.sh']. The rest of the config should already be similar.


.. code-block:: yaml

   apiVersion: v1
   data:
     keycloak.sh: |
       #!/usr/bin/env bash

       set -o errexit
       set -o nounset

       exec /opt/jboss/tools/docker-entrypoint.sh -b 0.0.0.0 -Dkeycloak.profile.feature.token_exchange=enabled -Dkeycloak.profile.feature.admin_fine_grained_authz=enabled -Dkeycloak.profile.feature.upload_scripts=enabled -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=<NEW_CONFIGURATION_FILE> -Dkeycloak.migration.strategy=OVERWRITE_EXISTING
   kind: ConfigMap
   metadata:
     creationTimestamp: "2020-09-09T09:41:35Z"
     labels:
       app.kubernetes.io/instance: oisp
       app.kubernetes.io/managed-by: Helm
       app.kubernetes.io/name: keycloak
       helm.sh/chart: keycloak-6.0.4
     name: keycloak-sh
     namespace: oisp
     resourceVersion: "27384"
     selfLink: /api/v1/namespaces/oisp/configmaps/keycloak-sh
     uid: bbbc4f7d-8a9a-447e-85df-b796a893efd3


.. note:: The variable NEW_CONFIGURATION_FILE is usually the realm file that is provided by the oisp/keycloak container, which is /opt/jboss/keycloak/realms/oisp-realm.json.

Now delete the pod, after it comes back you can import the users configuration file through keycloak dahboard or using keycloak admin console. Make sure to select the option 'skip if existing' at import strategy because some of the service users might create conflicts. Keycloak tries to import the users in a very tolerable, indestructive way. For example, if the user roles are not defined in the realm, then it simply removes them, or if the secret of the keycloak server has changed, it resets the passwords of all users that are imported.

After upgrading do not forget to revert keycloak-sh to its old form. Otherwise you might lose crucial data due to overwriting.

There are also other options that keycloak offers for exporting/importing. Check them out at `here <https://www.keycloak.org/documentation.html>`_.


Updating from v2.0.1 to v2.0.2
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

#. Prepare kafka update by removing the old stateful-set: 

.. code-block:: bash

  keycloak -n <NAMESPACE> delete sts/oisp-kafka --cascade=false

2. Apply update with helm (cf. :ref:`section-upgrade-helm`)

3. Change ingress to route mqtt traffic to EMQX

.. code-block:: bash

  kubectl -n ingress-nginx edit cm/tcp-services
  EDIT THE FOLLOWING:  "8883": oisp-staging/mqtt-server:8883 => "8883": oisp-staging/emqx:8883


