import os
from sys import stderr, argv
import time
import base64
import json

import requests
import oisp

def load_config_from_env(varname, seen_keys=None):
    """Read OISP config, which is an extended JSON format
    Values starting with @@ or %% are further ENV variables."""
    if seen_keys is None:
        seen_keys = []
    config = json.loads(os.environ[varname])
    for key, value in config.items():
        try:
            if value[:2] in ['@@', '%%']:
                assert key not in seen_keys, "Cyclic config"
                seen_keys.append(key)
                config[key] = load_config_from_env(value[2:], seen_keys[:])
        except TypeError: #value not indexable = not string or unicode
            pass
    return config

def get_oisp_user_token(uri, username, password, max_nr_tries=10):
    for _ in range(max_nr_tries):
        try:
            oisp_client = oisp.Client(uri)
            oisp_client.auth(username, password)
            return oisp_client.user_token.value
        except (requests.exceptions.ConnectionError, oisp.client.OICException):
            print("Can not connect to {}, retrying".format(uri), file=stderr)
            time.sleep(1)
    print("Failed to connect to OISP frontend", file=stderr)
    exit(1)

conf = load_config_from_env("OISP_RULEENGINE_CONFIG")
token = get_oisp_user_token(f"http://{conf['frontendUri']}/v1/api",
                            conf["username"], conf["password"])

URL = "http://oisp-flink-jobmanager:8081"
ENTRY_CLASS = "org.oisp.RuleEngineBuild"
CONFIG = {"application_name": "rule_engine_dashboard",
          "dashboard_strict_ssl": False,
          "dashboard_url": "http://{}".format(conf["frontendUri"]),
          "kafka_servers": conf["kafkaConfig"]["uri"],
          "kafka_zookeeper_quorum": conf["zookeeperConfig"]["zkCluster"],
          "kafka_observations_topic": conf["kafkaConfig"]["topicsObservations"],
          "kafka_rule_engine_topic": conf["kafkaConfig"]["topicsRuleEngine"],
          "kafka_heartbeat_topic": conf["kafkaConfig"]["topicsHeartbeatName"],
          "kafka_heartbeat_interval": conf["kafkaConfig"]["topicsHeartbeatInterval"],
          "hbase_table_prefix": "local",
          "token": token,
          "zookeeper_hbase_quorum": conf["zookeeperConfig"]["zkCluster"].split(":")[0]
}
CONFIG_SERIALIZED = base64.b64encode(json.dumps(CONFIG).encode("utf-8")).decode("utf-8")
ARGS = ("""--runner=FlinkRunner --streaming=true """
        """--JSONConfig={} """).format(CONFIG_SERIALIZED)

response = requests.post(f"{URL}/jars/upload", files={"jarfile": open(argv[1], "rb")})

if response.status_code != 200:
    print("Could not submit jar, server returned:\n",
          response.request.body.decode("utf-8"), file=stderr)
    exit(1)

jar_id = response.json()["filename"].split("/")[-1]
response = requests.post(f"{URL}/jars/{jar_id}/run",
                         json={"entryClass": ENTRY_CLASS,
                               "programArgs": ARGS})
if response.status_code != 200:
    print("Could run job, server returned:\n",
          response.request.body.decode("utf-8"), file=stderr)
    exit(1)
