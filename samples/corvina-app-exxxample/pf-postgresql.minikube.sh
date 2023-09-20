echo username: corvina_app_exxxample
echo password: $(kubectl --context=minikube -n corvina-app-exxxample get secret postgresql-exxxample-secrets -o jsonpath="{.data.password}" | base64 --decode)

# create a port forward to the postgresql service
kubectl --context=minikube -n corvina-app-exxxample port-forward svc/exxxample-postgresql 6432:5432