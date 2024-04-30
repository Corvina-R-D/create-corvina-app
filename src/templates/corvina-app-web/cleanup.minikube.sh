helm --kube-context=corvina-minikube -n corvina-app-[| .Name |] uninstall corvina-app-[| .Name |]
kubectl --context corvina-minikube delete ns corvina-app-[| .Name |]