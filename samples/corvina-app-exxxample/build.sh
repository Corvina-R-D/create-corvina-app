#!/bin/bash
current_directory=$PWD
echo $current_directory/app/

# --------------------------- #
# build docker image for app
# --------------------------- #
cd $current_directory/app/
echo 'Start building app with VITE_SERVICE_URL=' $VITE_SERVICE_URL
docker build --build-arg VITE_SERVICE_URL -t exxxample_app .
docker tag exxxample_app:latest exxxample_app:local

# --------------------------- #
# build docker image for service
# --------------------------- #
cd $current_directory/service/
docker build -t exxxample_service .
docker tag exxxample_service:latest exxxample_service:local

# --------------------------- #
# build docker image for fake http service
# --------------------------- #
cd $current_directory/fake-http-server/
docker build -t fake_http_server .
docker tag fake_http_server:latest fake_http_server:local

# --------------------------- #
# build docker image for external auth service
# --------------------------- #
cd $current_directory/authz_server/
docker build -t authz .
docker tag authz:latest authz:local
