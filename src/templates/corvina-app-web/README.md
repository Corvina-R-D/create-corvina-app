# corvina app exxxample

## How to start this project with docker-compose for developing

* add to your `/etc/hosts` the following line `127.0.0.1 exxxample.local.gd`
* follow instruction in [How to start this project with minikube](#how-to-start-this-project-with-minikube) till minikube tunnel
* run in a shell `docker-compose up postgresql redis` and leave it running
* run in a shell `cd app && cp -n ./.env.dist ./.env || true && npm i && npm run dev` and leave it running
* run in a shell `cd service && cp -n ./.env.dist ./.env || true && npm i && npm run start:dev` and leave it running
* install the app locally, run

  ```sh
  export TOKEN=$(curl http://127.0.0.1:3943/auth/realms/sample1/protocol/openid-connect/token -s | jq -r .access_token)
  curl -X 'POST' \
    'http://localhost:3000/v1/installed' \
    -H 'accept: */*' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "key": "corvina-app-exxxample",
      "apiVersion": "1.0.0",
      "clientId": "user-service-exxxampleadmin@exor",
      "clientSecret": "43024c91-cd1e-4877-bc21-6e61b2d80a49",
      "baseUrl": "http://127.0.0.1:3943",
      "apiBaseUrl": "https://app.corvina.fog:10443",
      "authBaseUrl": "https://auth.corvina.fog:10443",
      "openIdConfigurationUrl": "http://127.0.0.1:3943/auth/realms/sample1/.well-known/openid-configuration",
      "wsBaseUrl": "wss://app.corvina.fog:10443",
      "organizationId": 36,
      "instanceId": "43024c91-cd1e-4877-bc21-6e61b2d80a49",
      "eventType": "installed",
      "realm": "exor",
      "realmValidationRole": "monitoring.roles.app_exxxample_administrator"
    }'
  ```

* browse to <http://127.0.0.1:3943/index> to emulated to be inside the corvina app

## How to start this project with minikube

* run `minikube start`
* install istioctl, run `istioctl install --set profile=minimal`
* install cert-manager, run `kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml`
* execute `helm --kube-context=minikube dependency update helm-charts/corvina-app-exxxample/`
* run the script `./start-all-locally.minikube.sh` (istall docker with snap? <https://stackoverflow.com/questions/55316850/docker-build-result-could-not-read-ca-certificate-permission-denied-via>)
* run `minikube tunnel --bind-address=0.0.0.0` and leave it running
* install certificates `./install-certificate-locally.sh`
* install the previous certificates in the browser
* install the app locally, run

  ```sh
  export TOKEN=$(curl -k https://fake.exxxample.local.gd:11073/auth/realms/sample1/protocol/openid-connect/token -s | jq -r .access_token)
  curl -k -X 'POST' \
    'https://exxxample.local.gd:11073/v1/installed' \
    -H 'accept: */*' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "key": "corvina-app-exxxample",
      "apiVersion": "1.0.0",
      "clientId": "user-service-exxxampleadmin@exor",
      "clientSecret": "43024c91-cd1e-4877-bc21-6e61b2d80a49",
      "baseUrl": "https://fake.exxxample.local.gd:11073",
      "apiBaseUrl": "https://app.corvina.fog:10443",
      "authBaseUrl": "https://auth.corvina.fog:10443",
      "openIdConfigurationUrl": "http://fake-http-server-service/auth/realms/sample1/.well-known/openid-configuration",
      "wsBaseUrl": "wss://app.corvina.fog:10443",
      "organizationId": 36,
      "instanceId": "43024c91-cd1e-4877-bc21-6e61b2d80a49",
      "eventType": "installed",
      "realm": "exor",
      "realmValidationRole": "monitoring.roles.app_exxxample_administrator"
    }'
  ```

* browse to <https://fake.exxxample.local.gd:11073/index> to emulated to be inside the corvina app

## How to test this project inside corvina in localhost (TODO: check if needed)

* follow the previous istruction ([How to start this project with minikube](#how-to-start-this-project-with-minikube))
* edit the configmap called coredns in kube-system namespace adding the corvina hosts, something link this

  ```conf
  hosts {
      192.168.49.1 host.minikube.internal
      192.168.49.1 corvina.fog app.corvina.fog auth.corvina.fog licenses.corvina.fog pairing.corvina.fog broker.corvina.fog appengine.api.platform.corvina.fog api.platform.corvina.fog localhost
      fallthrough
  }
  ```

* bootstrap corvina from the repo corvina-k8s
* checkout the repo corvina-app/frontend-new and start it `yarn run dev` (branch feature/ECC-1547 at the time writing)
* login with admin@exor
* enable experimental feature Ctrl+Shift+Alt+S: serviceAccounts, apps and store
* create a serviceAccount called exxxampleadmin@exor
* copy the "Client Secret"
* create a role called monitoringrolesappexxxampleadministrator
* add the "Application Role" monitoringrolesappexxxampleadministrator to the user admin@exor
* run this in terminal (filling the "Client Secret" previously copied)

  ```sh
  curl -k -X 'POST' \
    'https://exxxample.local.gd:11073/v1/installed' \
    -H 'accept: */*' \
    -H 'Content-Type: application/json' \
    -d '{
    "key": "corvina-app-exxxample",
    "apiVersion": "1.0.0",
    "clientId": "user-service-exxxampleadmin@exor",
    "clientSecret": "43024c91-cd1e-4877-bc21-6e61b2d80a49",
    "baseUrl": "http://localhost:8080",
    "apiBaseUrl": "https://app.corvina.fog:10443",
    "authBaseUrl": "https://auth.corvina.fog:10443",
    "openIdConfigurationUrl": "https://auth.corvina.fog:10443/auth/realms/exor/.well-known/openid-configuration",
    "wsBaseUrl": "wss://app.corvina.fog:10443",
    "organizationId": 36,
    "instanceId": "43024c91-cd1e-4877-bc21-6e61b2d80a49",
    "eventType": "installed",
    "realm": "exor",
    "realmValidationRole": "exor.roles.app_monitoringrolesappexxxampleadministrator"
  }'
  ```

* navigate to application

## How to stop this project  

* run the script cleanup.sh

## How to update this project based on docker images  

* run the script update-service.sh

## How to run tests on this project?

I'm focusing right now on the test related to the service, so I'm using the following commands to run the tests:

* follow the instructions to start the project with minikube till the point where you have the minikube tunnel running
* start postgresql and fake-http-server: run `docker-compose up postgresql redis fake-http-server` and leave it running
* run `cd service && npm run test`

## How to release in production?

You can run the script `./draft-new-release.sh` to create a new release, or you can do it manually with the following steps:

* update Chart.yaml with the new appVersion `chart-X.X.X`
* push something on master
* tag master with chart-appVersion (appVersion from Chart.yaml) `git tag chart-X.X.X`
* push the tag `git push origin chart-X.X.X`

Behind the scene the google build will do the following:

* build all the docker images
* push the docker image to gcr.io with a tag based on the chart-appVersion

once the build is done, you can deploy the new version of the app with the following command:

* `./deploy.internal-qa.sh`

## Required software

* docker
* kubectl
* minikube
* local.gd (no installation required)
* istioctl
* helm
* kubectx
* kubens
* semver <https://github.com/fsaintjacques/semver-tool>
* oras <https://oras.land/cli/>

I find <https://github.com/alexellis/arkade> very useful to install software on my local machine!
