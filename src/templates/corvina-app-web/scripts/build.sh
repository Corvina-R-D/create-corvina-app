#!/bin/bash


cd $(dirname $0)

. ./common.sh

# --------------------------- #
# build docker image for app
# --------------------------- #
cd ../app/

# set default value for VITE_SERVICE_URL
VITE_SERVICE_URL=${VITE_SERVICE_URL:-}

echo 'Start building app with VITE_SERVICE_URL=' $VITE_SERVICE_URL
docker build --build-arg VITE_SERVICE_URL -t ${app_name}_app . --progress plain
docker tag ${app_name}_app:latest europe-west1-docker.pkg.dev/corvina-app-${app_name}/images/corvina-app-${app_name}-frontend:latest-master
# --------------------------- #
# build docker image for service
# --------------------------- #
cd ../service/
docker build -t ${app_name}_service . --progress plain
docker tag ${app_name}_service:latest europe-west1-docker.pkg.dev/corvina-app-${app_name}/images/corvina-app-${app_name}-backend:latest-master
