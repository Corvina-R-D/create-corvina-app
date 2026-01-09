#!/bin/bash

cd $(dirname $0)/..

. ./scripts/common.sh

(
  cd helm-charts
  helmfile -e minikube deps
)

./deploy.sh minikube --no-diff

# --------------------------- #
# trigger a new deployment for all services if first argument is "restart"
# --------------------------- #
if [ "${1-}" = "restart" ]; then
  kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deploy
fi
