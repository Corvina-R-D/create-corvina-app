#!/bin/bash

set -euo pipefail

cd $(dirname $0)/..

. ./scripts/common.sh

# the chart is installed from the branch of the minikube entry of helm-charts/envs/environments.yaml: the working
# tree when it is the current branch (local changes included), otherwise a temporary worktree of origin/<branch>
branch="$(yq eval -r 'explode(.) | .minikube.branch // ""' helm-charts/envs/environments.yaml)"
deploy_dir=.
if [[ -n "$branch" && "$branch" != "$(git branch --show-current)" ]]; then
  echo "Installing the chart of origin/$branch (minikube branch of helm-charts/envs/environments.yaml)"
  git fetch -q origin "$branch"
  deploy_dir="$(mktemp -d)"
  trap 'git worktree remove --force "$deploy_dir"' EXIT
  git worktree add -q --detach "$deploy_dir" FETCH_HEAD
fi

(
  cd "$deploy_dir/helm-charts"
  helmfile -e minikube deps
)

# on the clusters argocd labels the app namespace (managedNamespaceMetadata): the network policies of
# corvina select the app namespaces by this label
kubectl --context corvina-minikube create namespace corvina-app-${app_name} --dry-run=client -o yaml \
  | kubectl --context corvina-minikube label --local -f - corvina.io/app-namespace=true -o yaml \
  | kubectl --context corvina-minikube apply -f -

"$deploy_dir/deploy.sh" minikube --no-diff

# --------------------------- #
# trigger a new deployment for all services if first argument is "restart"
# --------------------------- #
if [ "${1-}" = "restart" ]; then
  kubectl --context corvina-minikube -n corvina-app-${app_name} rollout restart deploy
fi
