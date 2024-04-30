#!/bin/bash
# --------------------------- #
# upgrade charts
# --------------------------- #
kubectl --context corvina-minikube create ns corvina-app-[| .Name |] --dry-run=client -o yaml | kubectl --context=corvina-minikube apply -f -
helm --kube-context=corvina-minikube dependency update helm-charts/corvina-app-[| .Name |]/
helm --kube-context=corvina-minikube \
  -n corvina-app-[| .Name |] \
  --values helm-charts/corvina-app-[| .Name |]/values.minikube.yaml \
  upgrade --install \
  corvina-app-[| .Name |] helm-charts/corvina-app-[| .Name |]/
# --------------------------- #
# trigger a new deployment for all services if first argument is "restart"
# --------------------------- #
if [ "$1" = "restart" ]; then
  kubectl --context corvina-minikube -n corvina-app-[| .Name |] rollout restart deploy
fi