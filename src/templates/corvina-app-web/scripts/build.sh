#!/bin/bash

. $(dirname $0)/common.sh

current_directory=$PWD

echo $current_directory/app/

# --------------------------- #
# build docker image for app
# --------------------------- #
cd $current_directory/app/

if [ ! -e .env ]; then
    echo "Creating default .env file from .env.dist"
    cp .env.dist .env
fi
set -a; . .env; set +a;

echo 'Start building app with VITE_SERVICE_URL=' $VITE_SERVICE_URL
docker build --build-arg VITE_SERVICE_URL -t ${app_name}_app .
docker tag ${app_name}_app:latest europe-west1-docker.pkg.dev/corvina-app-${app_name}/images/corvina-app-${app_name}-frontend:latest-master
# --------------------------- #
# build docker image for service
# --------------------------- #
cd $current_directory/service/
docker build -t ${app_name}_service .
docker tag ${app_name}_service:latest europe-west1-docker.pkg.dev/corvina-app-${app_name}/images/corvina-app-${app_name}-backend:latest-master
