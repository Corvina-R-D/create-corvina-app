#!/bin/bash

. $(dirname $0)/scripts/common.sh

# --------------------------- #
# You need to configure the context "internal-qa" before running this script.
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
helm --kube-context=internal-qa \
  -n corvina-app-${app_name} \
  --values helm-charts/istio-discovery.values.yaml \
  upgrade --install --create-namespace \
  istio-discovery istio/istiod --version 1.20.4


# --------------------------- #
helm --kube-context=internal-qa \
    -n corvina-app-${app_name} \
    upgrade --install \
    --values helm-charts/corvina-app-${app_name}/values.internal-qa.yaml \
    corvina-app-${app_name} \
    helm-charts/corvina-app-${app_name}/