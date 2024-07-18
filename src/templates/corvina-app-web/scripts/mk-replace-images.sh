#!/bin/bash

. $(dirname $0)/common.sh

function setImagePullPolicyToIfNotPresent() {
  kubectl patch deployment $1 --context corvina-minikube -n corvina-app-${app_name} --type='json' -p='[{"op": "replace", "path":"/spec/template/spec/containers/0/imagePullPolicy", "value": "IfNotPresent"}]';
}
function restartDeployment() {
  kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deploy $1;
}
eval $(minikube -p corvina-minikube docker-env);
setImagePullPolicyToIfNotPresent service-deployment;
setImagePullPolicyToIfNotPresent app-deployment;
./scripts/build.sh;
restartDeployment service-deployment;
restartDeployment app-deployment;
eval $(minikube -p corvina-minikube docker-env -u);