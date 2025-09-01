# corvina app [| .Name |]

## Required software

* git
* nodejs  
* docker  
[|- if .K8sEnabled |]
* minikube  
[|- end |]
* arkade <https://github.com/alexellis/arkade>: very useful to install CLI tools and Kubernetes apps  
* kubectl `arkade get kubectl`  
* istioctl `arkade get istioctl`  
* helm `arkade get helm`  
  *  helm-diff `helm plugin install https://github.com/databus23/helm-diff`
* helmfile `arkade get helmfile`  
* jq `arkade get jq`  
* yq `arkade get yq`  
* semver <https://github.com/usvc/semver>  

![Try custom application](https://storage.googleapis.com/corvina-public-assets/create-corvina-app-readme-custom-app.png)

[|- if .K8sEnabled |]

## How to start this project with minikube

* run `./minikube-start.sh` in the main Corvina chart https://github.com/Corvina-R-D/corvina-k8s/blob/develop/charts/minikube-start.sh
  * make sure you read all the prerequisites, especially regarding the installation of the self-signed certificate in your browser (see https://exorint.atlassian.net/wiki/spaces/DEV/pages/319389697/Development+with+Minikube#Self-signed-certificates)
* run the script `./start-all-locally.corvina-minikube.sh`
* install the app from the Corvina App Store in your organization.

## How to stop this project  

* run the script `cleanup.minikube.sh`

## How to update this project based on docker images  

* run the script `./scripts/mk-replace-images.sh`

[|- end |]

## How to run tests on this project?

I'm focusing right now on the test related to the service, so I'm using the following commands to run the tests:

* run `./start-all-development.sh`
* run `cd service && npm run test`

[|- if .K8sEnabled |]

## How to release in production?

You can run the script `./draft-new-release.sh <major|minor|patch>` to create a new release, or you can do it manually with the following steps:

* update Chart.yaml with the new appVersion `chart-X.X.X`
* push something on master
* tag master with chart-appVersion (appVersion from Chart.yaml) `git tag chart-X.X.X`
* push the tag `git push origin chart-X.X.X`

Behind the scene the build pipelines will do the following:

* build all the docker images
* push the docker image to gcr.io with a tag based on the chart-appVersion

once the build is done, you can deploy the new version of the app with the following command:

* `./deploy.sh <environment>`

[|- end |]

[|- if .SingleDockerfile |]

## How to deploy this project on Heroku

Follow these steps to deploy this project on Heroku:

* run `heroku login`
* run `heroku container:login`
* run `heroku create corvina-app-[| .Name |]`
* run `heroku container:push web -a corvina-app-[| .Name |]`
* run `heroku container:release web -a corvina-app-[| .Name |]`
* run `heroku config:edit -a corvina-app-[| .Name |]`
* run `heroku addons:create heroku-postgresql -a corvina-app-[| .Name |]`
* run `heroku config:edit -a corvina-app-[| .Name |] # with db credentials`
* run `heroku logs --tail -a corvina-app-[| .Name |]`
* run `heroku config:set PGSSLMODE=no-verify -a corvina-app-[| .Name |]`
* run `heroku config:set MANIFEST_BASE_URL=$(heroku info -a corvina-app-[| .Name |] -j | jq -r .app.web_url) -a corvina-app-[| .Name |]`
* run `heroku config:set MANIFEST_BASE_URL_FE_APP=$(heroku info -a corvina-app-[| .Name |] -j | jq -r .app.web_url) -a corvina-app-[| .Name |]`

[|- end |]
