#!/bin/bash

. $(dirname $0)/common.sh

echo username: corvina_app_${app_name}
echo password: $(kubectl --context=minikube -n corvina-app-${app_name} get secret ${app_name}-postgresql -o jsonpath="{.data.password}" | base64 --decode)

# create a port forward to the postgresql service
kubectl --context=minikube -n corvina-app-${app_name} port-forward svc/${app_name}-postgresql 6432:5432