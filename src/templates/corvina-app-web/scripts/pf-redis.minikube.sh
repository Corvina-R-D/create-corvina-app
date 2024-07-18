#!/bin/bash

. $(dirname $0)/common.sh

echo username: default
echo password: $(kubectl --context=minikube -n corvina-app-${app_name} get secret ${app_name}-redis -o jsonpath="{.data.redis-password}" | base64 --decode)

# create a port forward to the postgresql service
kubectl --context=minikube -n corvina-app-${app_name} port-forward svc/${app_name}-redis-headless 6679:6379