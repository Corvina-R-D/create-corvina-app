#!/bin/bash

cd $(dirname $0)/..

. ./scripts/common.sh

(
  cd helm-charts
  helmfile -e minikube deps
)

# on the clusters argocd labels the app namespace (managedNamespaceMetadata): the network policies of
# corvina select the app namespaces by this label
kubectl --context corvina-minikube create namespace corvina-app-${app_name} --dry-run=client -o yaml \
  | kubectl --context corvina-minikube label --local -f - corvina.io/app-namespace=true -o yaml \
  | kubectl --context corvina-minikube apply -f -

./deploy.sh minikube --no-diff

# --------------------------- #
# trigger a new deployment for all services if first argument is "restart"
# --------------------------- #
if [ "${1-}" = "restart" ]; then
  kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deploy
fi
