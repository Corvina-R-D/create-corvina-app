# --------------------------- #
# You need to configure the context "internal" before running this script.
# --------------------------- #
helm --kube-context=internal \
    -n corvina-app-[| .Name |] \
    upgrade --install \
    --values helm-charts/corvina-app-[| .Name |]/values.internal.yaml \
    corvina-app-[| .Name |] \
    helm-charts/corvina-app-[| .Name |]/