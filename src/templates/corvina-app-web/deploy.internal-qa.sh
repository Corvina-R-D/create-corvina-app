#!/bin/bash

. $(dirname $0)/scripts/common.sh

# --------------------------- #
# You need to configure the context "internal-qa" before running this script.
# --------------------------- #
helm --kube-context=internal-qa \
    -n corvina-app-${app_name} \
    upgrade --install \
    --values helm-charts/corvina-app-${app_name}/values.internal-qa.yaml \
    corvina-app-${app_name} \
    helm-charts/corvina-app-${app_name}/