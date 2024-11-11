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

./deploy.sh corvina-minikube

# --------------------------- #
# trigger a new deployment for all services if first argument is "restart"
# --------------------------- #
if [ "${1-}" = "restart" ]; then
  kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deploy
fi
