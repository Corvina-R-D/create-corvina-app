#!/bin/bash

. $(dirname $0)/scripts/common.sh

kubectl --context=corvina-minikube -n corvina-app-${app_name} get secrets ${app_name}-crt-secret -o jsonpath='{.data}' | jq '."ca.crt"' -r | base64 --decode > /tmp/${app_name}-ca.crt

if  [ -e "`which update-ca-certificates`" ]; then

	sudo mkdir -p /usr/local/share/ca-certificates/${app_name}
  sudo cp /tmp/${app_name}-ca.crt /usr/local/share/ca-certificates/${app_name}/${app_name}-ca.crt
  sudo update-ca-certificates

elif [ -e "`which security`" ]; then

	sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /tmp/${app_name}-ca.crt

fi
