Upgrading OISP
==============

This document is currently work-in progres (WIP). It will include the necessary steps to update OISP fail-safe.

.. note:: Before any update, make sure you have a backup of the system, see :ref:`Backup`.


The recommended order to upgrade the platform is to

#. Upgrade the operators
#. Upgrade the Helm chart
#. Upgrade Keycloak manually (if need be)

Upgrade tests in the CI
-----------------------

From now on, CI will try to do upgrade tests in its nightly builds. It will first deploy the current release version of OISP and will try to update it to the latest alongside with database migrations.

It is important that the CURRENT_RELEASE_VERSION environment variable is properly set in the CI for this test to work. If someone wants to skip this test, then they can also simply set this variable to empty string.

Check CI configuration file for more information on the matter.

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

For simplicity, the update should be performed with only one Keycloak instance.

Upgrading Keycloak with automated migration script
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can now use the environment variable 'FORCE_MIGRATION' in the oisp/keycloak container and set it to a non-empty string (e.g: by editing the oisp-config configmap) to trigger an automatic keycloak migration. You can also pass this as an argument to 'make upgrade-oisp' like 'make upgrade-oisp FORCE_MIGRATION="true"'. The migration script takes a backup of your current system in the keycloak pod and tries to migrate it to the current version. Nevertheless it is important to backup before doing the migration, because if something goes wrong and the pod dies, you might potentially lose your backup. Here are the things to look out for, when using this option.

#. As long as the FORCE_MIGRATION variable is set to something non-empty, keycloak will try to migrate on every restart. After a successful migration, it is vital that the variable is set to an empty string again. Note that this is also valid, if you are using the 'Makefile' for the migration, it will not revert the environment variable back.
#. The directory for the backup is '/opt/jboss/keycloak/realms', backup files end with '*-backup'.json.
#. Due to the nature of keycloak, it is hard to provide meaningful logs during the migration, however all the logs will be written in the '/opt/jboss/keycloak/realms', specifically with two files: 'export_logs' and 'import_logs'
#. When you start a migration, the script will first attempt to export current data for backup, and them import the changes. There is a hard time limit for both of these tasks, and keycloak will fail if it cannot manage to migrate before the timeout.
#. This method of migration is less prone to bugs, because the migration is done internally, the manual upgrade must be the last resort.







Upgrading Keycloak Version
~~~~~~~~~~~~~~~~~~~~~~~~~~

The official Keycloak documentation recommends to update the version one after the other, i.e. not to skip major versions. This guarantees the correct migration of the configuration files. After each migration, Keycloak's database should be exported and replaced with the old configuration so that Keycloak can migrate the new configuration during the next release upgrade. To export the current configuration, Keycloak provides argument variables stored in the keycloak-sh configmap.

.. code-block:: bash

  KUBE_EDITOR=<YOUR_TEXT_EDITOR> kubectl -n <NAMESPACE> edit configmaps keycloak-sh

The configmap should look like this:

.. note:: The arguments are listed in the line that starts with command 'exec', at data['keycloak.sh']. The rest of the config should already be similar.


.. code-block:: yaml

  apiVersion: v1
  data:
    keycloak.sh: |
      #!/usr/bin/env bash

      set -o errexit
      set -o nounset

      exec /opt/jboss/tools/docker-entrypoint.sh -b 0.0.0.0 -Dkeycloak.profile.feature.token_exchange=enabled -Dkeycloak.profile.feature.admin_fine_grained_authz=enabled -Dkeycloak.profile.feature.upload_scripts=enabled -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=/opt/jboss/keycloak/realms/<FILE TO EXPORT TO>
  ...

After keycloak finishes the export, you can get the copy of the current realm data:

.. code-block:: bash

  kubectl -n <NAMESPACE> cp <KEYCLOAK_POD_NAME>:/opt/jboss/keycloak/realms/<EXPORTED FILE> ./<DESTINATION>

The exported file contains the realm configuration and the users in the database. If you wish to use the configuration file as a template and seperate users from the realm configuration, you can adjust the argument variables. An example of export with users and realm configuration in seperate files is presented at :ref:`UpdatingKeycloakRealm` section.

.. _UpdatingKeycloakRealm:

Updating Keycloak Realm
~~~~~~~~~~~~~~~~~~~~~~~

The steps to update the keycloak realm configuration are:

#. Export the current users and realm configuration in seperate files.
#. Overwrite the current configuration file with the new one.
#. Import users to the new configuration.

.. code-block:: bash

  KUBE_EDITOR=<YOUR_TEXT_EDITOR> kubectl -n <NAMESPACE> edit configmaps keycloak-sh


.. note:: The arguments are listed in the line that starts with command 'exec', at data['keycloak.sh']. The rest of the config should already be similar.


Adjust the argument variables according to the example below.

.. code-block:: yaml

    apiVersion: v1
    data:
      keycloak.sh: |
        #!/usr/bin/env bash

        set -o errexit
        set -o nounset

        exec /opt/jboss/tools/docker-entrypoint.sh -b 0.0.0.0 -Dkeycloak.profile.feature.token_exchange=enabled -Dkeycloak.profile.feature.admin_fine_grained_authz=enabled -Dkeycloak.profile.feature.upload_scripts=enabled -Dkeycloak.migration.action=export -Dkeycloak.migration.provider=dir -Dkeycloak.migration.dir=/opt/jboss/keycloak/realms -Dkeycloak.migration.userExportStrategy=SAME_FILE
    ...


.. note:: After changing the arguments for exporting, keycloak might not function properly (the server might not start). This behavior is not officially documented in the keycloak documentation but it is consistently observed. Do not forget to revert the arguments back after the process is completed, so the server can start.


With the SAME_FILE strategy, we get two configuration files. One of them contains only the users in the realm. The other one contains the rest of the data.

If you want to use the realm configuration file as a template for future, there are some secret variables you have to adjust. These are secrets of the clients and private/public keys that are used for encryption. All of the template variables in the configuration file follow the scheme '{{ INSERT-VARIABLE-NAME }}'. It is highly recommended to check `/platform-launcher/docker/keycloak/oisp-realm.json <https://github.com/Open-IoT-Service-Platform/platform-launcher/blob/develop/docker/keycloak/oisp-realm.json>`_ and `/platform-launcher/kubernetes/values.yaml keycloak section <https://github.com/Open-IoT-Service-Platform/platform-launcher/blob/8b84943c71bcae8ed03760a0f64cc762f285f2e9/kubernetes/values.yaml#L167>`_ to learn how to overwrite template variables during runtime.

There are three ways to import the exported realm configuration file:

* (Recommended) Adjust keycloak configuration through the dashboard manually. Check out the release notes for release specific migration guides. This option prevents exporting/importing.
* If there are no changes in the general realm configuration (e.g: event listeners, encryption algorithms) and the change does not bring major overwriting or deletion, you can try to import the configuration file directly through keycloak dashboard. For example, if the change is only a new client, you can select to only import clients with the option of skipping existing ones. This method may not always work if the change is complex.
* Either prepare a template from the exported configuration file or put it directly into the keycloak container. Then, adjust the keycloak.sh arguments to make an import with overwriting enabled. This method requires more effort but it is guaranteed to work.

To overwrite the current configuration (the new configuration file is in the keycloak container at this stage), change the keycloak-sh configmap:

.. note:: The arguments are listed in the line that starts with command 'exec', at data['keycloak.sh']. The rest of the config should already be similar.

.. code-block:: yaml

   apiVersion: v1
   data:
     keycloak.sh: |
       #!/usr/bin/env bash

       set -o errexit
       set -o nounset

       exec /opt/jboss/tools/docker-entrypoint.sh -b 0.0.0.0 -Dkeycloak.profile.feature.token_exchange=enabled -Dkeycloak.profile.feature.admin_fine_grained_authz=enabled -Dkeycloak.profile.feature.upload_scripts=enabled -Dkeycloak.migration.action=import -Dkeycloak.migration.provider=singleFile -Dkeycloak.migration.file=<NEW_CONFIGURATION_FILE> -Dkeycloak.migration.strategy=OVERWRITE_EXISTING
   ...

.. note:: The variable NEW_CONFIGURATION_FILE is usually the realm file that is provided by the oisp/keycloak container, which is /opt/jboss/keycloak/realms/oisp-realm.json.

Now delete the pod, after it restarts, you can import the users configuration file through keycloak dahboard or using keycloak admin console. Make sure to select the option 'skip if existing' at import strategy because some of the service users might create conflicts. Keycloak tries to import the users in a very tolerable, indestructive way. For example, if the user roles are not defined in the realm, then it simply removes them, or if the private key of the keycloak server has changed, it resets the passwords of all users that are imported.

.. note:: If you import the users through the Keycloak GUI, the user UIDs might change. In that case you have to run the migration tool in the oisp-frontend repository, which syncs the UIDs between the OISP and the Keycloak.

After upgrading do not forget to revert keycloak-sh configmap to its old form. Otherwise you might lose crucial data due to overwriting.

There are also other options that keycloak offers for exporting/importing. Check them out at `here <https://www.keycloak.org/documentation.html>`_.

Updating from v2.0.1 to v2.0.2
------------------------------

#. Prepare kafka update by removing the old stateful-set:

.. code-block:: bash

  keycloak -n <NAMESPACE> delete sts/oisp-kafka --cascade=false

2. Apply update with helm (cf. :ref:`section-upgrade-helm`)

3. Change ingress to route mqtt traffic to EMQX

.. code-block:: bash

  kubectl -n ingress-nginx edit cm/tcp-services
  EDIT THE FOLLOWING:  "8883": oisp-staging/mqtt-server:8883 => "8883": oisp-staging/emqx:8883

Updating from v2.0.3.beta.1 to v2.0.4.beta.3
--------------------------------------------
Before updating OISP, update keycloak first:

1. Login into **Keycloak Admin Dashboard**
2. In the OISP realm, navigate to: **Client Scopes** and create a new scope with the name **oisp-frontend**.
3. Go to the newly created **oisp-frontend** scope, and click on the mappers section. Create a new mapper with the name **oisp-frontend**, select **Audience** as the mapper type and **oisp-frontend** as the **Included Client Audience**. Leave **Included Custom Audience** empty. Make sure that the option **Add to Access Token** is on and **Add to ID Token** is off.
4. Now, navigate to: **Clients** -> **oisp-frontend** -> **Client Scopes**
5. In the menu below, add the following scope to the **Default Client Scopes**:
    - **oisp-frontend**
6. Again, in the menu below, remove the following scope from the **Optional Client Scopes** and add it back into the **Default Client Scopes**:
    - **offline_access**
7. You can now update OISP to **v2.0.4.beta.3**
