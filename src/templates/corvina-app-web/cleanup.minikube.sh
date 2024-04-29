helm --kube-context=minikube uninstall corvina-app-[| .Name |]
kubectl --context minikube delete ns corvina-app-[| .Name |]