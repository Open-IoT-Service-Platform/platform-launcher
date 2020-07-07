#!/bin/bash
# This script is checking readiness of Kubernetes services and returns 0 if all ready, 1 non recoverable errors and 2 for timeouts

NAMESPACE=$1

function check_deployment {
  local name=$1
  local namespace=$2
  local label=$3
  local counts_max=$4
  local counts_actual=0
  error=0;

  printf "\nWaiting for $name"
  while kubectl -n $namespace get pods -l=app=$label -o jsonpath="{.items[*].status.containerStatuses[*].ready}" | grep -q false;
    do printf ".";
      let counts_actual=$counts_actual+1;
      if [ $counts_actual -ge $counts_max ];
        then exit 2
      fi
      sleep 5;
    done
    return 0
}


function check_job {
  local name=$1
  local namespace=$2
  local counts_max=$3
  local counts_actual=0
  error=0;

  printf "\nWaiting for $name"
  while ! kubectl -n $namespace get job $name -o jsonpath="{.status.succeeded}" | grep 1 >> /dev/null;
    do printf ".";
      let counts_actual=$counts_actual+1;
      if [ $counts_actual -ge $counts_max ];
        then exit 2
      fi
      sleep 5;
    done
}

function check_sts {
  local name=$1
  local namespace=$2
  local counts_max=$3
  local counts_actual=0
  error=0;

  printf "\nWaiting for $name"
  while kubectl -n $namespace get pods ${name}-0 -o jsonpath="{.items[*].status.containerStatuses[*].ready}" | grep -q false;
    do printf ".";
      let counts_actual=$counts_actual+1;
      if [ $counts_actual -ge $counts_max ];
        then exit 2
      fi
      sleep 5;
    done
}

function check_beamservice {
  local name=$1
  local namespace=$2
  local counts_max=$3
  local counts_actual=0  
  printf "\nWaiting for $name"
  until (kubectl -n oisp get bs rule-engine -o yaml | grep "state: RUNNING");
    do printf "."
    let counts_actual=$counts_actual+1;
    if [ $counts_actual -ge $counts_max ];
      then exit 2
    fi
    sleep 1;
  done;
}

counts_actual=0
counts_max=60

#As long as any pod is pending - do not go forward
printf "\nWaiting for pending ";
while kubectl -n $NAMESPACE get pods | grep -q Pending; \
		do printf ".";
      let counts_actual=$counts_actual+1;
      sleep 5;
      if [ $counts_actual -ge $counts_max ];
        then exit 2;
      fi
    done;

check_deployment backend ${NAMESPACE} backend 60
check_deployment frontend ${NAMESPACE} frontend 60
check_deployment mqtt-server ${NAMESPACE} mqtt-server 60
check_deployment kairosdb ${NAMESPACE} mqtt-server 60
check_deployment websocket-server ${NAMESPACE} mqtt-server 60
check_job dbsetup ${NAMESPACE} 60
check_sts keycloak ${NAMESPACE} 60
check_beamservice rule-engine ${NAMESPACE} 60

printf "\ndone\n"
exit 0;
