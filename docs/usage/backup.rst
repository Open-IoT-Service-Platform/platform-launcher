Backup and Restore
==================

Backup and Restore options are provided by the Makefile.

.. code-block:: bash

  make backup
  make restore BACKUPFILE=file.tgz


Backup creates a tgz in folder backups with the current date and time. It contains the postgres DB backup, (selected) configmaps, (selected) secrets, and a list of deployment/statefuleset images and docker tags.
It does NOT backup the TSDB (yet). So if all is restored in a clean new installation, the metrics will be missed.

Restore is either using the tgz provided in the env variable BACKUPFILE, or it will select the most recent backup.
The backup is changing the passwords for Postgres users. Therefore, both, running keycloak and frontend pods have to be deleted. Grafana password is not reset. Therefore there will be a mismatch between grafana and frontend.
To solve it, the grafana deployment has to be removed and redeployed with ``make upgrade-oisp``.
