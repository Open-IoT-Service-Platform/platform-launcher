Upgrading OISP
==============

This document is currently work-in progres(WIP). It will include the necessary steps to update OISP fail-safe.

.. note:: Before any update, make sure you have a backup of the system, see :ref:`Backup`.

Upgrading Keycloak manually
---------------------------

For the sake of simplicity, the upgrading should only be done when there is only one Keycloak instance.

Upgrading Keycloak Version
~~~~~~~~~~~~~~~~~~~~~~~~~~

Official Keycloak documentation recommends upgrading the version one at a time, meaning not to skip any major releases between the final and the current versions. This guarantees the correct migration  of the configuration files. After each migration, the database of the Keycloak should be exported and be replaced with the old configuration, so that Keycloak can migrate the new configuration by next release upgrade. To export the current configuration  Keycloak offers argument variables which is stored in the keycloak-sh configmap.

.. code-block:: bash

  KUBE_EDITOR=<YOUR_TEXT_EDITOR> kubectl -n <NAMESPACE> edit configmaps keycloak-sh


The configmap should look like this:

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

After Keycloak starts and finishes the export, you can get the copy of the current realm data:


.. code-block:: bash

  kubectl -n <NAMESPACE> cp <KEYCLOAK_POD_NAME>:/opt/jboss/keycloak/realms/<EXPORTED FILE> ./<DESTINATION>


Updating Keycloak Realm
~~~~~~~~~~~~~~~~~~~~~~~

Similar to the version upgrading, it is recommended that the user does not skip any major release for smooth migration.

The steps to update Keycloak realm are:

#. Export the current users and other configurations in seperate files.
#. Overwrite the current configuration file with the new one.
#. Import users to the new configuration.

.. code-block:: bash

  KUBE_EDITOR=<YOUR_TEXT_EDITOR> kubectl -n <NAMESPACE> edit configmaps keycloak-sh


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

With the SAME_FILE strategy, we get two confiugarition files, one of them only contains the users in the system. The other one contains the rest of the data.

To overrite the current configuration, change keycloak-sh. again:

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

Now delete the pod, after it comes back import the the users configuration file through keycloak dahboard or using keycloak admin console. Make sure to select skip at import strategy because some of the service users might create conflicts. Keycloak tries to import the users in a very tolerable, indestructive way. If the user roles are not defined in the realm, then it simply removes them, or the secret of the keycloak server has changed, it resets passwords of all users that are imported.

After upgrading do not forget to revert keycloak-sh to its old form. Otherwise you might lose curucial data due to overwriting.

There are also other options that Keycloak offers for exporting/importing. Check them out at `here<https://www.keycloak.org/documentation.html>`_.
