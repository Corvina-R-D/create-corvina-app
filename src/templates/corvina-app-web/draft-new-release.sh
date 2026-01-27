#!/bin/bash

set -euo pipefail

. $(dirname $0)/scripts/common.sh

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
new_app_version=$(npx semver -i $version_type $current_app_version)

echo "New computed version is $new_app_version (was $current_app_version)"

new_branch=""
if [ "$version_type" != "patch" ]; then
    current_app_major_minor_version="$(grep -Eo '^[0-9]*\.[0-9]*' <<< "$current_app_version")"
    echo "Releasing a new major/minor: version bump is now applied to your current branch ($current_branch), while the existing app version is now branched in chart-${current_app_major_minor_version}-hotfix"
    new_branch="chart-${current_app_major_minor_version}-hotfix"
    git switch -c "$new_branch"
    truncate -s 0 helm-charts/envs/{this,hotfix}-branch-tags.yaml
    git add helm-charts/envs/{this,hotfix}-branch-tags.yaml
    git commit --allow-empty helm-charts/envs/{this,hotfix}-branch-tags.yaml -m "Release chart-${current_app_version} (hotfix branch created)"
    git checkout "$current_branch"
else
    echo "Releasing a new patch version: version bump is now applied to the current branch only"
fi

# update the appVersion in the chart
yq eval ".appVersion = \"chart-${new_app_version}\"" -i helm-charts/corvina-app-${app_name}/Chart.yaml

git diff

# Add a confirmation prompt before applying changes
read -p "Are you sure you want to apply these changes to ${current_branch}? (y/n) " -n 1 -r
echo    # move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Changes not applied."
    exit 1
fi
# commit all the changes
git commit helm-charts/corvina-app-${app_name}/Chart.yaml -m "Release chart-${new_app_version}"
git push -u origin "$current_branch" $new_branch
echo "Branches $current_branch $new_branch pushed, now wait for the image builds and tag updates in helm-charts/envs/hotfix-branch-tags.yaml (hotfix branches)"
