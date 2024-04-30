echo username: default
echo password: $(kubectl --context=minikube -n corvina-app-[| .Name |] get secret [| .Name |]-redis -o jsonpath="{.data.redis-password}" | base64 --decode)

# create a port forward to the postgresql service
kubectl --context=minikube -n corvina-app-[| .Name |] port-forward svc/[| .Name |]-redis-headless 6679:6379