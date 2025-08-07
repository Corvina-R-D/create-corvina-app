#!/bin/bash

. $(dirname $0)/common.sh

cd $(dirname $0)

shopt -s extglob
set -eo pipefail

# Define a cleanup function to perform actions before exiting
cleanup() {

  # if current branch is create-corvina-app
  if git rev-parse --abbrev-ref HEAD | grep -q create-corvina-app ; then
    echo "An error occurred. Leave branch create-corvina-app and return to previous branch"
    git checkout -f -
  fi
}

# Set the trap to call the cleanup function on ERR signal
trap cleanup ERR INT

create_corvina_app_command=${CREATE_CORVINA_APP_COMMAND:-npx @corvina/create-corvina-app@latest}
create_corvina_app_creation_options=${create_corvina_app_creation_options:-}

echo $create_corvina_app_command

if ! git show-ref --quiet refs/heads/create-corvina-app ; then
    # do we have it in origin?
    if git ls-remote --exit-code --heads origin create-corvina-app ; then
        git fetch origin create-corvina-app
        git checkout -b create-corvina-app origin/create-corvina-app
    else
        echo "Scaffold branch not detected. Initializing scaffold branch..."

        create_corvina_app_original_version=${create_corvina_app_version:-latest}
        create_corvina_app_original_command=${CREATE_CORVINA_APP_COMMAND:-npx @corvina/create-corvina-app@$create_corvina_app_original_version}

        cd ..

        # Create an orphan branch
        git checkout --orphan create-corvina-app

        # list untracked files and ask to remove them
        git clean -d -f -i

        # Remove all files from the indexs
        git rm -rfq .

        # list untracked files and ask to remove them 
        git clean -d -f -i

        # checkout initial content
        $create_corvina_app_original_command webapp --name $app_name --disable-name-validation --skip-package-lock-generation


        git add .
        # Move all files except . and ..
        find .
        git mv corvina-app-$app_name/!(.|..) .
        git commit -a -m "Initialize scaffold branch with version $($create_corvina_app_original_command version)"
    fi

else
    echo "Scaffold branch detected. Skipping initialization and checking out branch create-corvina-app."
    cd ..
    git checkout create-corvina-app
    git pull origin create-corvina-app
fi

# list untracked files and ask to remove them
git clean -d -f -i

git rm -rfq .

# list untracked files and ask to remove them 
git clean -d -f -i

$create_corvina_app_command webapp --name $app_name $create_corvina_app_creation_options --disable-name-validation --skip-package-lock-generation

git add corvina-app-$app_name

git mv corvina-app-$app_name/!(.|..) .
git diff --cached
git commit -a -m "Update scaffold to version $($create_corvina_app_command version)"

# get the SHA of the last commit
last_commit_sha=$(git rev-parse HEAD)
echo
echo "You can cherry-pick the latest scaffold changes to your branch with the following command:"
echo "git cherry-pick $last_commit_sha"

git checkout -

