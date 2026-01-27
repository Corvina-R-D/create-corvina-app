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
* npx

![Try custom application](https://storage.googleapis.com/corvina-public-assets/create-corvina-app-readme-custom-app.png)

[|- if .K8sEnabled |]

## How to start this project with minikube

* run `./minikube-start.sh` in the main Corvina chart https://github.com/Corvina-R-D/corvina-k8s/blob/develop/charts/minikube-start.sh
  * make sure you read all the prerequisites, especially regarding the installation of the self-signed certificate in your browser (see https://exorint.atlassian.net/wiki/spaces/DEV/pages/319389697/Development+with+Minikube#Self-signed-certificates)
* run the script `./scripts/install.minikube.sh`
* the app should self-register in the app store: manually install the app in your organization.

## How to completely remove the app

* manually remove all app installations in your organizations (by UI, or using swagger corvina-core /api/v1/organizations/{organizationId}/apps/{id})
* run the script `cleanup.minikube.sh` (uninstalls via helmfile and deletes the namespace)
* (optional) manually remove the app from the store (swagger corvina-core /api/v1/apps/{appId})

## How to update this project based on docker images

You can rebuild the images from the current status of the git worktree:

```bash
./scripts/replace-images.minikube.sh
```

The image will be set for the frontend and backend deployments and the pods will be restarted, but migrations will not be run again.

An invocation of `./scripts/install.minikube.sh` or `./deploy.sh minikube` will rollback the changes.

## How to run a local version of the frontend or backend

You can hook your host-run version of the app (frontend or backend) with the scripts `./scripts/localhost-redirect.minikube.sh <namespace> <service> <k8s service port>:<local port>`. The scripts normally sleeps until you terminate it, and cleanups the recirection on exit.

The local app should be configured with `./service/.env.dist` or `./app/.env.dist`, which point the application to the other components installed in minikube.

[|- end |]

## How to run tests on this project?

I'm focusing right now on the test related to the service, so I'm using the following commands to run the tests:

* run `./start-all-development.sh`
* run `cd service && npm run test`

[|- if .K8sEnabled |]

## How to run migrations

Every time the chart is installed (or the app is synced with ArgoCD), a job is started to run backend migrations. To rerun the migrations, simply upgrade the helm chart again, or sync again on ArgoCD.

The backend deployment stalls the creation of upgraded pods until the job executes at least once succesfully, for the current backend image tag. After that, the migration can be rerun but the backend is not automatically restarted.

## How to release in production?

Releases are identified to the semver version of the chart, like `chart-1.2.3`. We use tagged hotfix branches like `chart-1.2-hotfix`. For more information, the release workflow is documented in our [Confluence](https://exorint.atlassian.net/wiki/spaces/DEV/pages/731480068/Corvina+app+Development+and+release+workflows).

In order to release a new version and trigger the image builds, use the script `./draft-new-release.sh <major|minor|patch>`:
- if you are bumping the patch number, the changes will be committed to the current branch (this is the expected workflow for hotfix branches)
- if you are bumping the major or minor numbers, the *current* branch (typically master) will first be forked to a hotfix branch with the *current* major and minor version numbers, and the new version will be committed to the current branch.

It is an error to invoke `./draft-new-release.sh` with major or minor from a hotfix branch. New non-patch releases can be created from master or feature branches.

After pushing the changes, builds will be triggered and the repo will be updated with the new image tags.

Once the build is done, you can deploy the new version of the app with the following command:

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
