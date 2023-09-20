# --------------------------- #
# You need to configure the context "corvina-app-exxxample-internal-qa" before running this script.
# --------------------------- #
helm --kube-context=internal \
    -n corvina-app-exxxample \
    upgrade --install \
    --values helm-charts/corvina-app-exxxample/values.internal.yaml \
    corvina-app-exxxample \
    helm-charts/corvina-app-exxxample/