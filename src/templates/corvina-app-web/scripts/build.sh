#!/bin/bash

set -euo pipefail

cd $(dirname $0)

. ./common.sh

if [[ $# -eq 1 && "$1" != "--only-backend" ]]; then
    echo "One argument passed and it's NOT --only-backend: $1"
    exit
fi

# set default value for VITE_SERVICE_URL
export VITE_SERVICE_URL=${VITE_SERVICE_URL:-}
TAG=${TAG:-latest}
REGISTRY=${REGISTRY:-europe-docker.pkg.dev/corvina-app-${app_name}/images}

if ! [[ $# -eq 1 && "$1" == "--only-backend" ]]; then
  # --------------------------- #
  # build docker image for app
  # --------------------------- #
  cd ../app/

  echo 'Start building app with VITE_SERVICE_URL=' $VITE_SERVICE_URL
  docker build --build-arg VITE_SERVICE_URL . --progress plain -t ${REGISTRY}/corvina-app-${app_name}-frontend:${TAG}
fi

# --------------------------- #
# build docker image for service
# --------------------------- #
cd ../service/
docker build . --progress plain -t ${REGISTRY}/corvina-app-${app_name}-backend:${TAG}
