#!/bin/bash
current_directory=$PWD
echo $current_directory/app/

. $(dirname $0)/scripts/common.sh

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
docker tag ${app_name}_app:latest ${app_name}_app:local

# --------------------------- #
# build docker image for service
# --------------------------- #
cd $current_directory/service/
docker build -t ${app_name}_service .
docker tag ${app_name}_service:latest ${app_name}_service:local

