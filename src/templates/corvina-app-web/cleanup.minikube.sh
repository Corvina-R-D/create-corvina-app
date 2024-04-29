helm --kube-context=minikube -n corvina-app-[| .Name |] uninstall corvina-app-[| .Name |]
kubectl --context minikube delete ns corvina-app-[| .Name |]