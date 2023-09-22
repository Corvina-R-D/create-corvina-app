#!/bin/bash

kubectl --context=minikube -n corvina-app-[| .Name |] get secrets [| .Name |]-crt-secret -o jsonpath='{.data}' | jq '."ca.crt"' -r | base64 --decode > /tmp/[| .Name |]-ca.crt

if  [ -e "`which update-ca-certificates`" ]; then

	sudo mkdir -p /usr/local/share/ca-certificates/[| .Name |]
  sudo cp /tmp/[| .Name |]-ca.crt /usr/local/share/ca-certificates/[| .Name |]/[| .Name |]-ca.crt
  sudo update-ca-certificates

elif [ -e "`which security`" ]; then

	sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /tmp/[| .Name |]-ca.crt

fi
