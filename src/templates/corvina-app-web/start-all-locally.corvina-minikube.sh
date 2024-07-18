#!/bin/bash

. $(dirname $0)/scripts/common.sh

# --------------------------- #
# install deps
# --------------------------- #
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
helm --kube-context=corvina-minikube \
  -n corvina-app-${app_name} \
  --values helm-charts/istio-discovery.values.yaml \
  upgrade --install --create-namespace \
  istio-discovery istio/istiod --version 1.20.4

# --------------------------- #
# upgrade charts
# --------------------------- #
kubectl --context corvina-minikube create ns corvina-app-${app_name} --dry-run=client -o yaml | kubectl --context=corvina-minikube apply -f -
helm --kube-context=corvina-minikube dependency update helm-charts/corvina-app-${app_name}/
helm --kube-context=corvina-minikube \
  -n corvina-app-${app_name} \
  --values helm-charts/corvina-app-${app_name}/values.minikube.yaml \
  upgrade --install \
  corvina-app-${app_name} helm-charts/corvina-app-${app_name}/
# --------------------------- #
# trigger a new deployment for all services if first argument is "restart"
# --------------------------- #
if [ "$1" = "restart" ]; then
  kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deploy
fi
