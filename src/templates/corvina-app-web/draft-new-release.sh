#!/bin/bash

. $(dirname $0)/scripts/common.sh

if [ $# -lt 1 ]; then
    echo "Usage: $0 major|minor|patch"
    echo "Please provide the kind of update."
    exit 1
fi

# check if current branch is master
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "master" ]; then
    echo "Current branch is not master"
    exit 1
fi
# check if yq is installed
if ! command -v yq &> /dev/null
then
    echo "yq could not be found"
    exit 1
fi
# check if semver is installed
if ! command -v semver &> /dev/null
then
    echo "semver could not be found (curl -L https://raw.githubusercontent.com/usvc/semver/master/init/install.sh | sh)"
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
new_app_version=$(semver bump $version_type $current_app_version)

echo "New computed version is $new_app_version (was $current_app_version)"
pause

# update the appVersion in the chart
yq eval ".appVersion = \"chart-${new_app_version}\"" -i helm-charts/corvina-app-${app_name}/Chart.yaml

git diff

# Add a confirmation prompt before applying changes
read -p "Are you sure you want to apply these changes? (y/n) " -n 1 -r
echo    # move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # commit all the changes
    git add .
    git commit -m "Release chart-${new_app_version}"
    git push
    # create a new tag
    git tag chart-${new_app_version}
    git push origin chart-${new_app_version}
else
    echo "Changes not applied."
    exit 1
fi


