#!/bin/bash

kubectl --context=minikube -n corvina-app-exxxample get secrets exxxample-crt-secret -o jsonpath='{.data}' | jq '."ca.crt"' -r | base64 --decode > /tmp/exxxample-ca.crt

if  [ -e "`which update-ca-certificates`" ]; then

	sudo mkdir -p /usr/local/share/ca-certificates/exxxample
  sudo cp /tmp/exxxample-ca.crt /usr/local/share/ca-certificates/exxxample/exxxample-ca.crt
  sudo update-ca-certificates

elif [ -e "`which security`" ]; then

	sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /tmp/exxxample-ca.crt

fi
