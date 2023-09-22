echo username: corvina_app_{{ .Name }}
echo password: $(kubectl --context=minikube -n corvina-app-{{ .Name }} get secret {{ .Name }}-postgresql -o jsonpath="{.data.password}" | base64 --decode)

# create a port forward to the postgresql service
kubectl --context=minikube -n corvina-app-{{ .Name }} port-forward svc/{{ .Name }}-postgresql 6432:5432