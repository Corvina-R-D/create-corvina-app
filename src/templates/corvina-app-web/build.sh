#!/bin/bash
current_directory=$PWD
echo $current_directory/app/

# --------------------------- #
# build docker image for app
# --------------------------- #
cd $current_directory/app/
echo 'Start building app with VITE_SERVICE_URL=' $VITE_SERVICE_URL
docker build --build-arg VITE_SERVICE_URL -t {{ .Name }}_app .
docker tag {{ .Name }}_app:latest {{ .Name }}_app:local

# --------------------------- #
# build docker image for service
# --------------------------- #
cd $current_directory/service/
docker build -t {{ .Name }}_service .
docker tag {{ .Name }}_service:latest {{ .Name }}_service:local

