#!/bin/bash

set -euo pipefail

cd $(dirname $0)

. ./common.sh

if [[ $# -eq 1 && "$1" != "--only-backend" ]]; then
    echo "One argument passed and it's NOT --only-backend: $1"
    exit
fi

ONLYBACKEND=false
if [[ $# -eq 1 && "$1" == "--only-backend" ]]; then
    ONLYBACKEND=true
fi

eval $(minikube -p corvina-minikube docker-env)
if ! $ONLYBACKEND; then
    echo "Replacing both frontend and backend images in minikube..."
    REGISTRY=localhost TAG=minikube ./build.sh
else
    echo "Replacing only backend image in minikube..."
    REGISTRY=localhost TAG=minikube ./build.sh --only-backend
fi
eval $(minikube -p corvina-minikube docker-env -u)

kubectl --context corvina-minikube -n corvina-app-${app_name} set image deployment service-deployment service=localhost/corvina-app-${app_name}-backend:minikube
kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deployment service-deployment
if ! $ONLYBACKEND; then
    kubectl --context corvina-minikube -n corvina-app-${app_name} set image deployment app-deployment app=localhost/corvina-app-${app_name}-frontend:minikube
    kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deployment app-deployment
fi
kubectl --context corvina-minikube -n corvina-app-${app_name} rollout status deployment service-deployment app-deployment
