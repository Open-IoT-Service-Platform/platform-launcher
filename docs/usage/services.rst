Services
========

OISP can be extended with custom microservices that perform various streaming oder batch operations. The `oisp-services <https://kubernetes.io/docs/concepts/services-networking/service/>`_ repository contains the operator managing services, as well as couple of example services, such as the `rule engine <https://github.com/Open-IoT-Service-Platform/oisp-beam-rule-engine/tree/develop>`_.

.. note:: This is not to be confused with `Kubernetes services <https://kubernetes.io/docs/concepts/services-networking/service/>`_, which is a way of making Kubernetes deployments accessible.

Services operator
-----------------

Services are managed by an `operator <https://kubernetes.io/docs/concepts/extend-kubernetes/operator/>`_, which is based on the Zalando's `kopf <https://github.com/zalando-incubator/kopf>`_ framework. Services operator is part of the standard OISP installation.


Beam Services
~~~~~~~~~~~~~
Currently, the only supported service type is a `beam <https://beam.apache.org/>`_ service. You can verify that the corresponding CRD is installed by running:

.. code-block:: bash

  kubectl -n oisp get crd | grep beamservices.oisp.org

A beam service is provided to OISP as a jarfile.

.. note:: If you are setting the beam runner in compile time, note that OISP comes with the `Flink <https://flink.apache.org/>`_ runner by default.

Lets have a look at the Kubernetes resources of OISP's rule-engine as an example, **note that this is a HELM template!**:

.. code-block:: yaml

  apiVersion: oisp.org/v1
  kind: BeamService
  metadata:
    name: rule-engine
  spec:
    package:
      url: {{ .Values.ruleEngine.url }}
      username: {{ .Values.ruleEngine.ftpUsername }}
      password: {{ .Values.ruleEngine.ftpPassword }}
    entryClass: "org.oisp.RuleEngineBuild"

The `package` block describes how to get the jarfile. The url must be a valid http(s) or ftp path. If the jarfile is hosted in an FTP server, the username and password options are used for authentication.

`entryClass` is another mandatory parameter in `spec`, and is required by the Flink runner to start the application.

.. note:: A convenient way of building a CI pipeline for your services is to use a Docker multi stage build, of which the first stage builds the jarfile, and the second stage is a minimal http server that hosts the artifacts. You a can create a Kubernetes deployment using this image. This way you won't have to maintain an external server for hosting your jars.

The services operator also offers a convenient way of passing arguments to Flink runner. The `args` block under `spec` is used for this:

.. code-block:: yaml

     tokens:
     - user: {{ .Values.ruleEngine.username }}
       password: {{ .Values.ruleEngine.password }}
     args:
       runner: FlinkRunner
       streaming: "true"
       JSONConfig:
         format: |
           {{`{{
           "application_name": "rule_engine_dashboard",
           "dashboard_strict_ssl": false,
           "dashboard_url": "http://{config[ruleEngineConfig][frontendUri]}",
           "kafka_servers": "{config[kafkaConfig][uri]}",
           "kafka_zookeeper_quorum": "{config[zookeeperConfig][zkCluster]}" ,
           "kafka_observations_topic": "{config[kafkaConfig][topicsObservations]}",
           "kafka_rule_engine_topic": "{config[kafkaConfig][topicsRuleEngine]}",
           "kafka_heartbeat_topic": "{config[kafkaConfig][topicsHeartbeatName]}",
           "kafka_heartbeat_interval": "{config[kafkaConfig][topicsHeartbeatInterval]}",
           "zookeeper_hbase_quorum": "not used",
           "token": "{tokens[rule_engine@intel.com]}"
           }}`}}
         encode: base64

A simple key-value pair is passed on as a string. For more complicataed scenarios, a map of containing `format` and the optional `encode` parameter. If encode is not given, the formatted string will be passed on directly. Currenty, `base64` is the only suppported value for encoding.

The `format` string is a `Python f-string <https://www.python.org/dev/peps/pep-0498/>`_.
The following dictionaries are available:

* **config:** Contains the environment variables as defined in the `oisp-config` configmap.
* **tokens:** Key values are email addresses/usernames of oisp users, values are tokens obtained from the frontend. The authentication data has to be provided in the `tokens` block, as in the example above.

.. note:: Again, note that this is a Helm template. The opening {{` and the closing `}} are creating a string literal (from Helms perspective), so that the python f-string can use the inner {{, which is the escape sequence for a single curly bracket ({).
