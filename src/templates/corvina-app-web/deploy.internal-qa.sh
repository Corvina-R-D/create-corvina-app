# --------------------------- #
# You need to configure the context "internal-qa" before running this script.
# --------------------------- #
helm --kube-context=internal-qa \
    -n corvina-app-[| .Name |] \
    upgrade --install \
    --values helm-charts/corvina-app-[| .Name |]/values.internal-qa.yaml \
    corvina-app-[| .Name |] \
    helm-charts/corvina-app-[| .Name |]/