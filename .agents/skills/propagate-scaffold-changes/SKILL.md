---
name: propagate-scaffold-changes
description: Change the create-corvina-app scaffold and send the change to the apps generated from it (OTA and others). Use when a platform change, for example one made in corvina-k8s, must reach the scaffold and then every downstream app repository.
metadata:
  last_updated_at: "2026-11-03"
---

## Change the scaffold

1. Make a branch in create-corvina-app from an updated `master`.
2. Find where the change belongs. Shared chart templates are in `packages/helm/corvina-app-charts-lib/templates/`. The scaffold files in `src/templates/corvina-app-web/` are includes, values, scripts and the helmfile. Change both when necessary.
3. Search the whole repository, READMEs included, for the old names. Do this again at the end.
4. Bump `version` in `package.json` for every commit to this repository.
5. If the library values change in an incompatible way, bump `version` and `appVersion` in the library `Chart.yaml`. Change the dependency range in the scaffold `Chart.yaml`.

If the change follows another repository (for example corvina-k8s), read its commit first. Keep its conventions. If a topic has a reference file in `references/`, read it before you start. Use `references/gateway-api.md` for ingress, Gateway, HTTPRoute and VirtualService changes.

## Test the scaffold

1. Build the binary for your platform. The templates are embedded, so build after each change:
   `go build -tags netgo --ldflags "-s -w -X corvina/create-corvina-app/src/cmd.CliVersion=<package.json version>" -o build/main.go-<os>-<arch> main.go`
2. In an app repository, run `CREATE_CORVINA_APP_COMMAND="npx <path to the create-corvina-app checkout>" ./scripts/resync-create-corvina-app.sh`.
3. To render a generated app, use the options in `scripts/common.sh` of the app. An unreleased library version is not in the registry. Put the library in `helm-charts/<chart>/charts/`. In a test copy of `Chart.yaml`, remove the other dependencies and the `import-values` key. Add the library `defaults` as the first values file. Render with `helmfile template --skip-deps` for `minikube` and `internal-qa`, and set `app.tag` and `service.tag`.
4. Read the output. Make sure that the old names are not in it and that the new resources are correct.

## Release

Merge the scaffold change. If the library version changed, push the tag `corvina-app-charts-lib-<version>` before any app uses the new scaffold. The app dependency cannot resolve without it.

## Backport to an app

Do these steps in each app repository, on a clean working tree.

1. Run `scripts/resync-create-corvina-app.sh`. It makes the commit "Update scaffold to version X" on the branch `create-corvina-app`. Use the released version of create-corvina-app. Use the `CREATE_CORVINA_APP_COMMAND` form only for a trial.
2. Read the scaffold commit. When it is correct, push the branch (`git push origin create-corvina-app`).
3. Make a branch from the main branch of the app. Cherry-pick the scaffold commit. Resolve conflicts and keep the customizations of the app.
4. Apply the meaning of the change to the whole app, not only to the files that the scaffold covers. If the app has more workloads, routes, monitors or policies than the scaffold, change all of them to the new standard. Example: if the new standard changes how a Deployment waits for a Job, change every Deployment of the app.
5. Search the app for the old names. Render the chart for each environment, as in the scaffold test.
6. Set `create_corvina_app_version` in `scripts/common.sh` to the scaffold version of the commit.
7. Do not deploy, and do not push the main branch, without the approval of the user.

The scaffold commit can include unrelated changes (service code, library adoption) that conflict with the app. In this case, port only the helm-charts part of the change by hand. Leave the other parts as separate tasks. If the app does not use the chart library, change its own templates.
