# --------------------------- #
# You need to configure the context "corvina-app-{{ .Name }}-internal-qa" before running this script.
# --------------------------- #
helm --kube-context=corvina-app-{{ .Name }}-internal-qa \
    upgrade --install \
    --values helm-charts/corvina-app-{{ .Name }}/values.internal-qa.yaml \
    corvina-app-{{ .Name }} \
    helm-charts/corvina-app-{{ .Name }}/