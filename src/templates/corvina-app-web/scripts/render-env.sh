#!/bin/bash

set -euo pipefail

ENVIRONMENTS_FILE="$(dirname "$0")/../helm-charts/envs/environments.yaml"
WORKFLOW_FILE="render.yaml"

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [instance]"
  echo "If no instance is provided, all environments are rendered."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required but not installed"
  exit 1
fi

if ! command -v yq >/dev/null 2>&1; then
  echo "yq is required but not installed"
  exit 1
fi

if [[ ! -f "$ENVIRONMENTS_FILE" ]]; then
  echo "Environment source of truth not found: $ENVIRONMENTS_FILE"
  exit 1
fi

dispatch_instance() {
  local instance="$1"

  if ! yq eval -e "explode(.) | .\"$instance\"" "$ENVIRONMENTS_FILE" >/dev/null 2>&1; then
    echo "Instance '$instance' not found in $ENVIRONMENTS_FILE"
    return 1
  fi

  local hosting
  local branch
  hosting="$(yq eval -r "explode(.) | .\"$instance\".hosting // \"\"" "$ENVIRONMENTS_FILE")"
  branch="$(yq eval -r "explode(.) | .\"$instance\".branch // \"\"" "$ENVIRONMENTS_FILE")"

  if [[ ! "$branch" =~ ^master$|^chart-[0-9]+\.[0-9]+-hotfix$ ]]; then
    echo "Invalid branch '$branch' for instance '$instance'."
    echo "Allowed values: master or chart-<version>-hotfix"
    return 1
  fi

  echo "Dispatching workflow '$WORKFLOW_FILE' for instance '$instance'"
  echo "Hosting context: $hosting"
  echo "Render branch: $branch"

  # The workflow file is resolved on the selected ref/branch.
  gh workflow run "$WORKFLOW_FILE" --ref "$branch" -f environment="$instance"

  echo "Workflow dispatch submitted successfully."
  echo
}

if [[ $# -eq 1 ]]; then
  dispatch_instance "$1"
  exit $?
fi

echo "No instance provided: rendering all configured environments."
mapfile -t instances < <(yq eval -r 'explode(.) | keys | .[]' "$ENVIRONMENTS_FILE")

if [[ ${#instances[@]} -eq 0 ]]; then
  echo "No environments found in $ENVIRONMENTS_FILE"
  exit 1
fi

for instance in "${instances[@]}"; do
  dispatch_instance "$instance"
done
