#!/bin/bash

cd $(dirname $0)

. ./scripts/common.sh

# check if images are present, otherwise build from source
eval $(minikube -p corvina-minikube docker-env);

# check if images are already built, otherwise build from source
if [ ! "$(docker images -q europe-west1-docker.pkg.dev/corvina-app-${app_name}/images/corvina-app-${app_name}-frontend:latest-master 2> /dev/null)" ]; then
  echo "Images are not build yet. Run ./mk_replace_images.sh first.";
  ./scripts/mk-replace-images.sh
else
  echo "Images are already built. If you want to rebuild, run ./mk_replace_images.sh first.";
fi

eval $(minikube -p corvina-minikube docker-env -u);


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
  upgrade --install --timeout 30m \
  corvina-app-${app_name} helm-charts/corvina-app-${app_name}/
# --------------------------- #
# trigger a new deployment for all services if first argument is "restart"
# --------------------------- #
if [ "${1-}" = "restart" ]; then
  kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deploy
fi
