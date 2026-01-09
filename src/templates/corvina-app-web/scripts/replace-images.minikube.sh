#!/bin/bash

set -euo pipefail

cd $(dirname $0)

. ./common.sh

eval $(minikube -p corvina-minikube docker-env)
REGISTRY=localhost TAG=minikube ./build.sh
eval $(minikube -p corvina-minikube docker-env -u)

kubectl --context corvina-minikube -n corvina-app-${app_name} set image deployment service-deployment service=localhost/corvina-app-${app_name}-backend:minikube
kubectl --context corvina-minikube -n corvina-app-${app_name} set image deployment app-deployment app=localhost/corvina-app-${app_name}-frontend:minikube
kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deployment service-deployment app-deployment
kubectl --context corvina-minikube -n corvina-app-${app_name} rollout status deployment service-deployment app-deployment
