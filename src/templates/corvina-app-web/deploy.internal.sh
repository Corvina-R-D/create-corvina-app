#!/bin/bash

. $(dirname $0)/scripts/common.sh

# --------------------------- #
# You need to configure the context "internal" before running this script.
# --------------------------- #
helm --kube-context=internal \
    -n corvina-app-${app_name} \
    upgrade --install \
    --values helm-charts/corvina-app-${app_name}/values.internal.yaml \
    corvina-app-${app_name} \
    helm-charts/corvina-app-${app_name}/