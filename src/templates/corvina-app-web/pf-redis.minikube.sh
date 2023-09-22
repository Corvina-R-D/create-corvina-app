echo username: default
echo password: $(kubectl --context=minikube -n corvina-app-exxxample get secret exxxample-redis -o jsonpath="{.data.redis-password}" | base64 --decode)

# create a port forward to the postgresql service
kubectl --context=minikube -n corvina-app-exxxample port-forward svc/exxxample-redis-headless 6679:6379