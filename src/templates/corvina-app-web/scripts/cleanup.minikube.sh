#!/bin/bash

. $(dirname $0)/scripts/common.sh

cd $(dirname $0)/helm-charts
helmfile -e minikube delete
kubectl --context corvina-minikube delete ns corvina-app-${app_name}
