#!/bin/bash

. $(dirname $0)/scripts/common.sh

helm --kube-context=corvina-minikube -n corvina-app-${app_name} uninstall istio-discovery
helm --kube-context=corvina-minikube -n corvina-app-${app_name} uninstall corvina-app-${app_name}
kubectl --context corvina-minikube delete ns corvina-app-${app_name}