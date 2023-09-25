# create corvina app #

Setup a corvina web app in one command!

## Usage ##

You can create a new corvina web app by running the following command:

```bash
npx @corvina/create-corvina-app@latest webapp
```

This will prompt you to select a name for your app, and then create a new directory called `corvina-app-{name}`. Inside the directory, it will generate the initial project structure.

The basic structure of the project is as follows:

```bash
corvina-app-{name}
├── README.md
├── /app # frontend application written in vuejs and typescript
│   ├── package.json
|   ├── Dockerfile
│   ├── /src
│   ├── ...
├── /service # backend service written in nestjs and typescript
│   ├── package.json
|   ├── Dockerfile
│   ├── /src
│   ├── ...
├── /helm-charts # helm charts for the service and the app for local development and for deploying in corvina kubernetes cluster
│   ├── /corvina-app-{name}
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   ├── templates
│   │   ├── ...
```
