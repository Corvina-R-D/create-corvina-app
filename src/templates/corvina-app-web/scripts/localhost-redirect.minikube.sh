#!/bin/bash -x

set -euo pipefail

if [[ "$#" -lt 3 ]]; then
  echo "Usage: $0 <namespace> <service> <k8s service port>:<local port> [<k8s service port>:<local port>...]"
  exit
fi

namespace="$1"
service="$2"
shift 2

serviceobj="$(kubectl --context corvina-minikube -n "$namespace" get service/"$service" -o json)"
selector="$(jq -c '.spec.selector' <<< "$serviceobj")"
ports="$(jq -c '.spec.ports' <<< "$serviceobj")"
host_ip="$(minikube -p corvina-minikube ssh getent hosts host.minikube.internal | cut -f 1 -d ' ')"
field_manager="minikube-redirect-${service}"
already_applied="$(kubectl --context corvina-minikube -n "$namespace" get service/"$service" -o json | jq -r '.metadata.annotations["corvina.io/minikube-redirected-to"]')"

if [[ "$already_applied" != "null" ]]; then
  echo "Service $service in namespace $namespace is already redirected to $host_ip"
  echo "Stop prvious redirection or use \" ./minikube-redirect-stop.sh $service \" to undo the redirection"
  exit
fi

selectorString=$(echo $selector | jq -R -s @json)
portsString=$(echo $ports | jq -R -s @json)

# remove the selector for this service in the cluster, and replace the target port with the port where our local service is running
kubectl --context corvina-minikube -n "$namespace" patch --field-manager "$field_manager" service/"$service" --patch-file /dev/stdin <<EOF
metadata:
  annotations:
    corvina.io/minikube-redirect-orig-selector: $selectorString
    corvina.io/minikube-redirect-orig-ports: $portsString
    corvina.io/minikube-redirected-to: "$host_ip"
spec:
  selector: null
  ports:
    $(jq -R -c --argjson ports "$ports" '[scan("[^ ]+") | capture("(?<port>.*):(?<targetPort>.*)") | map_values(tonumber) | .port as $port | .name |= ($ports[] | select(.port == $port)).name ]' <<< "$*")
EOF

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
trap 'restore' EXIT

# create the manual endpoint pointing to host.minikube.internal
kubectl --context corvina-minikube -n "$namespace" replace --field-manager "$field_manager" -f - <<EOF
apiVersion: v1
kind: Endpoints
metadata:
  name: "$service"
  namespace: "$namespace"
  labels:
    corvina.io/minikube-redirected-to: "$host_ip"
subsets:
- addresses:
  - ip: "$host_ip"
  ports:
    $(kubectl --context corvina-minikube -n "$namespace" get service/"$service" -o json | jq -c '.spec.ports | map(.port = .targetPort) | del(.[]["nodePort", "targetPort"])')
EOF

# remove old orphaned EndpointSlice objects pointing to the pod
kubectl --context corvina-minikube -n "$namespace" delete endpointslices -l kubernetes.io/service-name="$service" --ignore-not-found

# done
echo
echo "Now redirecting ${service}.${namespace}.svc to local, interrupt this script to cleanup"
scaleobj="$(kubectl --context corvina-minikube -n "$namespace" get statefulset/"$service" deployment/"$service" -o name --ignore-not-found)"
if [[ -n "$scaleobj" ]]; then
  echo "You may want to scale the deployment on the cluster to zero:"
  echo "  kubectl --context corvina-minikube -n $namespace scale --replicas 0 $scaleobj"
fi

sleep infinity
