#!/bin/bash

. $(dirname $0)/scripts/common.sh

kubectl --context corvina-minikube delete ns corvina-app-${app_name}