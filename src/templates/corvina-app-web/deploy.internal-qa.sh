# --------------------------- #
# You need to configure the context "corvina-app-exxxample-internal-qa" before running this script.
# --------------------------- #
helm --kube-context=corvina-app-exxxample-internal-qa \
    upgrade --install \
    --values helm-charts/corvina-app-exxxample/values.internal-qa.yaml \
    corvina-app-exxxample \
    helm-charts/corvina-app-exxxample/