# corvina app [| .Name |]

## Required software

* git
* nodejs
* npx
* docker
* arkade <https://github.com/alexellis/arkade>: very useful to install CLI tools and Kubernetes apps
[|- if .K8sEnabled |]
* minikube
* kubectl `arkade get kubectl`
* istioctl `arkade get istioctl`
* helm `arkade get helm`
  *  helm-diff `helm plugin install https://github.com/databus23/helm-diff`
* helmfile `arkade get helmfile`
* jq `arkade get jq`
* yq `arkade get yq`
[|- end |]
[|- if .ExperimentalDevcontainer |]
* devcontainer CLI `npm i -g @devcontainers/cli`
[|- end |]

[|- if .K8sEnabled |]

## Development with Minikube

### How to start this project with minikube

* run `./minikube-start.sh` in the main Corvina chart https://github.com/Corvina-R-D/corvina-k8s/blob/develop/charts/minikube-start.sh
  * make sure you read all the prerequisites, especially regarding the installation of the self-signed certificate in your browser (see https://exorint.atlassian.net/wiki/spaces/DEV/pages/319389697/Development+with+Minikube#Self-signed-certificates)
* run the script `./scripts/install.minikube.sh`
* the app should self-register in the app store: manually install the app in your organization (check registration.enabled value in the helm chart)

### How to completely remove the app

* manually uninstall all app installations in your organizations (by UI, or using swagger corvina-core DELETE /api/v1/organizations/{organizationId}/apps/{id})
* run the script `cleanup.minikube.sh` (uninstalls via helmfile and deletes the namespace)
* (optional) manually remove the app from the store (swagger corvina-core DELETE /api/v1/apps/{appId})

### How to update this project based on docker images

You can rebuild the images from the current status of the git worktree:

```bash
./scripts/replace-images.minikube.sh
```

The image will be set for the frontend and backend deployments and the pods will be restarted, but migrations will not be run again.

An invocation of `./scripts/install.minikube.sh` or `./deploy.sh minikube` will rollback the changes.

### How to run a local version of the frontend or backend

You can hook your host-run version of the app (frontend or backend) with the scripts `./scripts/localhost-redirect.minikube.sh <namespace> <service> <k8s service port>:<local port>`. The scripts normally sleeps until you terminate it, and cleanups the recirection on exit.

The local app should be configured with `./service/.env.dist` or `./app/.env.dist`, which point the application to the other components installed in minikube.

To manually clean the active redirections set up by the localhost-redirect script, run `scripts/localhost-redirect-stop.minikube.sh <namespace> <service>`.

[|- end |]

## How to run tests on this project?

I'm focusing right now on the test related to the service.

[|- if .ExperimentalDevcontainer |]

The service devcontainer brings up its own postgresql[| if .RedisEnabled |]/redis[| end |][| if .RabbitEnabled |]/rabbitmq[| end |] and `service/.env.devcontainer` already points at them, so tests run in isolation from whatever `service/.env` you use for day-to-day development:

* start the service devcontainer: `devcontainer up --workspace-folder . --config .devcontainer/service/devcontainer.json`
* run the tests: `devcontainer exec --workspace-folder . --config .devcontainer/service/devcontainer.json npm run test`
[|- else |]

* run `cp -n service/.env.dist service/.env` and point its PG/REDIS/RABBITMQ variables at postgresql/redis/rabbitmq instances you have reachable locally
* run `cd service && npm run test`
[|- end |]

[|- if .K8sEnabled |]

### How to run migrations

Every time the chart is installed (or the app is synced with ArgoCD), a job is started to run backend migrations. To rerun the migrations, simply upgrade the helm chart again, or sync again on ArgoCD.

The backend deployment stalls the creation of upgraded pods until the job executes at least once succesfully, for the current backend image tag. After that, the migration can be rerun but the backend is not automatically restarted.

### How to release in production?

Releases are identified to the semver version of the chart, like `chart-1.2.3`. We use tagged hotfix branches like `chart-1.2-hotfix`. For more information, the release workflow is documented in our [Confluence](https://exorint.atlassian.net/wiki/spaces/DEV/pages/731480068/Corvina+app+Development+and+release+workflows).

In order to release a new version and trigger the image builds, use the script `./draft-new-release.sh <major|minor|patch>`:
- if you are bumping the patch number, the changes will be committed to the current branch (this is the expected workflow for hotfix branches)
- if you are bumping the major or minor numbers, the *current* branch (typically master) will first be forked to a hotfix branch with the *current* major and minor version numbers, and the new version will be committed to the current branch.

It is an error to invoke `./draft-new-release.sh` with major or minor from a hotfix branch. New non-patch releases can be created from master or feature branches.

After pushing the changes, builds will be triggered and the repo will be updated with the new image tags.

Once the build is done, you can deploy the new version of the app with the following command:

* `./deploy.sh <environment>`

### YAML source of truth for Helmfile environments

Environment metadata is centralized in `helm-charts/envs/environments.yaml`, keyed by Helmfile environment name (`instance`), with fields:

* `hosting`: Kubernetes context (cluster) where the app instance is hosted.
* `branch`: branch used for chart rendering (`master` or `chart-<major>.<minor>-hotfix`).
* `additionalOrigins`: list of additional CORS origins.

The `helm-charts/helmfile.yaml` file uses Helmfile templating to:

* generate the `environments:` list dynamically from the YAML map;
* inject `hosting` as `kubeContext`;
* inject `additionalOrigins` as `cors.additionalOrigins` (consumed by `virtual-service.yaml`).

### Trigger rendering

Use the script below to trigger the GitHub render pipeline with the correct branch for an instance:

```bash
./scripts/render-env.sh <instance>
```

Example:

```bash
./scripts/render-env.sh internal-qa
```

If no instance is provided, the script dispatches rendering for all configured environments:

```bash
./scripts/render-env.sh
```

The script reads the instance entry in `helm-charts/envs/environments.yaml` and runs:

* GitHub workflow: `render.yaml`
* ref/branch: from the `branch` field
* workflow input `environment`: from the environment key

[|- end |]

[|- if .ExperimentalDevcontainer |]

## Development with Devcontainer

This project ships a devcontainer for the `app` and one for the `service`, each bringing up its own dependencies (postgresql[| if .RedisEnabled |], redis[| end |][| if .RabbitEnabled |], rabbitmq[| end |]).

`service/` has three `.env` templates — copy the one matching how you're running it to `service/.env` before starting: `.env.dist` (k8s DNS names, for the minikube flow), `.env.devcontainer` (container-network hostnames, for running *inside* the devcontainer), `.env.dev` (localhost, for running on your host against the devcontainer's published ports).

* start the service devcontainer (this also brings up postgresql[| if .RedisEnabled |]/redis[| end |][| if .RabbitEnabled |]/rabbitmq[| end |]) and run it:
  ```bash
  devcontainer up --workspace-folder . --config .devcontainer/service/devcontainer.json
  devcontainer exec --workspace-folder . --config .devcontainer/service/devcontainer.json sh -c "cp -n .env.devcontainer .env && npm run start:dev"
  ```
* the first time, with a fresh postgresql database, run the migrations once before `start:dev`:
  ```bash
  devcontainer exec --workspace-folder . --config .devcontainer/service/devcontainer.json sh -c "cp -n .env.devcontainer .env && START_FEATURES=migrator.up,quit npm run start"
  ```
* in another terminal, start the app devcontainer and run it:
  ```bash
  devcontainer up --workspace-folder . --config .devcontainer/app/devcontainer.json
  devcontainer exec --workspace-folder . --config .devcontainer/app/devcontainer.json sh -c "cp -n .env.dist .env && npm run dev"
  ```
* if you prefer a GUI, VS Code's "Dev Containers: Reopen in Container" command works the same way when pointed at `.devcontainer/app` or `.devcontainer/service`
* to run the service on your host instead (e.g. `cd service && npm run start:dev`) while still using the devcontainer's postgresql[| if .RedisEnabled |]/redis[| end |][| if .RabbitEnabled |]/rabbitmq[| end |] (their ports are published to localhost), run `cp -n service/.env.dev service/.env` after bringing the service devcontainer up
* to stop the devcontainers, run:
  ```bash
  cd .devcontainer/app && docker compose down && cd -
  cd .devcontainer/service && docker compose down && cd -
  ```

### How to expose your local app to the Corvina Store without Minikube

* install ngrok and login in your account
* take the ngrok authtoken and put it in the ngrok.yml file
* create a domain to get a stable URL across restarts (otherwise ngrok assigns a new random one every time you run it): in the ngrok dashboard go to Universal Gateway > Domains, click "New Domain", and reserve a domain (a free static domain is included on the free plan, e.g. `your-name.ngrok-free.app`; a custom domain requires a paid plan)
* put that domain in the `hostname` field of the `service` tunnel in `ngrok.yml`
* install the "simple-modify-headers" browser extension and configure it for the url pattern `https://<ngrok-domain-url>/*` to add the request header `ngrok-skip-browser-warning: true` — otherwise ngrok's free tier shows an interstitial browser warning page instead of proxying the request
* run `ngrok start --config ngrok.yml service`
* put the ngrok URL in:
  * the `MANIFEST_BASE_URL` variable in `service/.env`
  * the `VITE_SERVICE_URL` variable in `app/.env`
* with the app and service running, curl the manifest, run `curl http://localhost:3000/v1/manifest.json` and copy the response
* browse in the Corvina Store and install the app via "Try custom application" button

![Try custom application](https://storage.googleapis.com/corvina-public-assets/create-corvina-app-readme-custom-app.png)

### How to deploy this project on Heroku

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
