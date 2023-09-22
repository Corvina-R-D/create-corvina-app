#!/bin/bash

# --------------------------- #
# build all services inside minikube
# --------------------------- #
eval $(minikube docker-env)
export VITE_SERVICE_URL=
./build.sh

# --------------------------- #
# upgrade charts
# --------------------------- #
kubectl --context minikube create ns corvina-app-{{ .Name }} --dry-run=client -o yaml | kubectl --context=minikube apply -f -
helm --kube-context=minikube -n corvina-app-{{ .Name }} upgrade --install {{ .Name }} helm-charts/corvina-app-{{ .Name }}/

# --------------------------- #
# trigger a new deployment for all services if first argument is "restart"
# --------------------------- #
if [ "$1" = "restart" ]; then
  kubectl --context minikube -n corvina-app-{{ .Name }} rollout restart deploy
fi