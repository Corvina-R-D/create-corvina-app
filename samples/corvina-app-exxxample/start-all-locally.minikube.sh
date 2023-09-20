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
kubectl --context minikube create ns corvina-app-exxxample --dry-run=client -o yaml | kubectl --context=minikube apply -f -
helm --kube-context=minikube -n corvina-app-exxxample upgrade --install exxxample helm-charts/corvina-app-exxxample/

# --------------------------- #
# trigger a new deployment for all services if first argument is "restart"
# --------------------------- #
if [ "$1" = "restart" ]; then
  kubectl --context minikube -n corvina-app-exxxample rollout restart deploy
fi