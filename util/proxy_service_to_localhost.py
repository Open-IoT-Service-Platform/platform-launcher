#!/usr/bin/python3
"""A script to proxy an OISP service running on k8s to localhost.

This assumes the cluster is configured in the default kubeconfig."""

from argparse import ArgumentParser
from os import system
import subprocess
import json

parser = ArgumentParser(description="Proxy kubernetes service to localhost.")
parser.add_argument("service", metavar="Service", type=str,
                    help="Service to proxy")
args = parser.parse_args()

service_conf = json.loads(subprocess.check_output(['kubectl', "-n", "oisp",
                                                   "-ojson", "get", "service",
                                                   args.service]))
endpoint_ports =  [{"port":p["port"], "name":str(p["port"])}
                   for p in service_conf["spec"]["ports"]]

new_service_conf = {
    "kind": "Service",
    "apiVersion": "v1",
    "metadata": {
        "name": service_conf["metadata"]["name"],
        "namespace": service_conf["metadata"]["namespace"]
    },
    "spec": {
        "ports": endpoint_ports
    }
}

endpoint_conf =  {
    "kind": "Endpoints",
    "apiVersion": "v1",
    "metadata": {
        "name": service_conf["metadata"]["name"],
        "namespace": service_conf["metadata"]["namespace"]
    },
    "subsets": [{
        "addresses": [{"ip": "172.17.0.1"}],
        "ports": endpoint_ports
    }]
}

json.dump(new_service_conf, (open("service.json", "w")))
json.dump(endpoint_conf, (open("endpoint.json", "w")))

system("kubectl -n oisp delete service {}".format(args.service))
system("kubectl apply -f service.json")
system("kubectl apply -f endpoint.json")
