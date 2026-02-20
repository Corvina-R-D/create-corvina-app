#!/bin/bash

set -euo pipefail

. "$(dirname "$0")/scripts/common.sh"

if [ $# -lt 1 ]; then
    echo "Usage: $0 major|minor|patch"
    echo "Please provide the kind of update."
    exit 1
fi

# check if we are sitting on a branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" == "HEAD" ]; then
    echo "Current HEAD is detached, please switch to a branch"
    exit 1
fi
# check if yq is installed
if ! command -v yq &> /dev/null
then
    echo "yq could not be found (arkade get yq)"
    echo "arkade ( https://github.com/alexellis/arkade ): very useful to install CLI tools and Kubernetes apps"
    exit 1
fi
# retrieve the current appVersion of the chart
current_app_version=$(yq eval '.appVersion' helm-charts/corvina-app-${app_name}/Chart.yaml)
# remove prefix chart-
current_app_version=${current_app_version//chart-/}
# read first argument as minor/major/patch
version_type=$1
# check if argument is valid
if [ "$version_type" != "minor" ] && [ "$version_type" != "major" ] && [ "$version_type" != "patch" ]; then
    echo "Invalid first argument. Use major/minor/patch"
    exit 1
fi
# increment the version
new_app_version=$(npx --yes semver -i "$version_type" $current_app_version)

echo "New computed version is $new_app_version (was $current_app_version)"

new_branch=""
if [[ "$version_type" != "patch" ]]; then
    current_app_major_minor_version="$(grep -Eo '^[0-9]*\.[0-9]*' <<< "$current_app_version")"
    new_branch="chart-${current_app_major_minor_version}-hotfix"
    git switch -c "$new_branch"
    truncate -s 0 helm-charts/envs/branch-tags.yaml
    git add helm-charts/envs/branch-tags.yaml
    git commit --allow-empty helm-charts/envs/branch-tags.yaml -m "Release chart-${current_app_version} (hotfix branch created)"
    git push -u origin "$new_branch"
    echo "Released a new major/minor: the existing app version ($current_app_version) is now branched to chart-${current_app_major_minor_version}-hotfix"
    echo "Builds for the app are now running, a PR will be automatically opened to set the new image tags in helm-charts/envs/branch-tags.yaml"
    git checkout "$current_branch"
fi

# now commit the version bump, possibly with a PR
commit_branch=$current_branch
if [[ $current_branch = "master" ]]; then
  read -p "Please specify a new branch name (ECC-xxxx) to open a PR to master, with the version bump $new_app_version (leave empty to commit directly on master): " -r
  if [[ -n $REPLY ]]; then
    commit_branch="$REPLY"
    git switch -c "$commit_branch"
  fi
fi

# update the appVersion in the chart
yq eval ".appVersion = \"chart-${new_app_version}\"" -i helm-charts/corvina-app-${app_name}/Chart.yaml

git diff -- helm-charts/corvina-app-${app_name}/Chart.yaml || true

# Add a confirmation prompt before applying changes
read -p "Are you sure you want to apply these changes to ${commit_branch}? (y/n) " -n 1 -r
echo    # move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Changes not applied."
    git restore helm-charts/corvina-app-${app_name}/Chart.yaml
    exit 1
fi

git commit helm-charts/corvina-app-${app_name}/Chart.yaml -m "Release chart-${new_app_version}"
git push -u origin "$commit_branch"
git checkout "$current_branch"
if [[ "$current_branch" != "$commit_branch" ]]; then
  echo "Opening new pull request..."
  gh pr create --base "$current_branch" --head "$commit_branch" --title "Bump chart version to $new_app_version" -w
fi
