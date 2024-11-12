#!/bin/bash

. $(dirname $0)/common.sh

cd $(dirname $0)

shopt -s extglob
set -eo pipefail

create_corvina_app_command=${CREATE_CORVINA_APP_COMMAND:-npx @corvina/create-corvina-app@latest}
create_corvina_app_creation_options=${create_corvina_app_creation_options:-}

echo $create_corvina_app_command

if ! git show-ref --quiet refs/heads/create-corvina-app ; then
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
    $create_corvina_app_original_command webapp --name $app_name --disable-name-validation 


    git add .
    # Move all files except . and ..
    git mv corvina-app-$app_name/!(.|..) .
    git commit -a -m "Initialize scaffold branch with version $($create_corvina_app_original_command version)"

else
    echo "Scaffold branch detected. Skipping initialization..."
    cd ..
    git checkout create-corvina-app
fi

# list untracked files and ask to remove them
git clean -d -f -i

git rm -rfq .

$create_corvina_app_command webapp --name $app_name --disable-name-validation $create_corvina_app_creation_options

git add corvina-app-$app_name

git mv corvina-app-$app_name/!(.|..) .
git diff --cached
git commit -a -m "Update scaffold to version $($create_corvina_app_command version)"

git checkout -
