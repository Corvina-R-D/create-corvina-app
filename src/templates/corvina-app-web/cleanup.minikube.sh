helm --kube-context=minikube uninstall {{ .Name }}
kubectl --context minikube delete ns corvina-app-{{ .Name }}