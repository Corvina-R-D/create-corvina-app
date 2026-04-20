#!/bin/bash -x

set -euo pipefail

if [[ "$#" < 2 ]]; then
  echo "Usage: $0 <namespace> <service> "
  exit
fi

namespace="$1"
service="$2"
shift 2

serviceobj="$(kubectl --context corvina-minikube -n "$namespace" get service/"$service" -o json)"
selectorString="$(jq -c '.metadata.annotations["corvina.io/minikube-redirect-orig-selector"]' <<< "$serviceobj")"
portsString="$(jq -c '.metadata.annotations["corvina.io/minikube-redirect-orig-ports"]' <<< "$serviceobj")"
field_manager="minikube-redirect-${service}"
already_applied="$(kubectl --context corvina-minikube -n "$namespace" get service/"$service" -o json | jq -r '.metadata.annotations["corvina.io/minikube-redirected-to"]')"

if [[ "$already_applied" == "null" ]]; then
  echo "Service $service in namespace $namespace is not redirected"
  exit
fi

# required jq version >= 1.6
selector=$(echo  $selectorString | jq -r | jq -c fromjson)
ports=$(echo $portsString | jq -r | jq -c fromjson)

# reset redirection for this service once this script terminates
function restore {
kubectl --context corvina-minikube -n "$namespace" patch --field-manager "$field_manager" service/"$service" --patch-file /dev/stdin <<EOF
metadata:
  annotations:
    corvina.io/minikube-redirect-orig-selector: null
    corvina.io/minikube-redirect-orig-ports: null
    corvina.io/minikube-redirected-to: null
spec:
  selector:
    $selector
  ports:
    $ports
EOF
}

restore
