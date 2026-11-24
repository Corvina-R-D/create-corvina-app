---
name: release-package
description: Release the create-corvina-app scaffold, the corvina-app-charts-lib Helm chart or the @corvina/nestjs-app-common-lib npm lib by creating the GitHub release and its tag, which the GitHub Actions workflows publish. Use when asked to release, publish, tag or bump the version of a package of this repo.
---

# Release a package of create-corvina-app

The procedure is shared by the Corvina repos and lives in
[corvina-github-public-actions](https://github.com/Corvina-R-D/corvina-github-public-actions/blob/master/skills/release-package/SKILL.md).
**Read it first** and follow it with the table below:

```bash
gh api repos/Corvina-R-D/corvina-github-public-actions/contents/skills/release-package/SKILL.md \
  -H 'Accept: application/vnd.github.raw'
```

If it can't be read, the essentials: create release and tag together on `master` (prereleases may target a
branch), never bump versions by hand (the workflows do it from the tag), no leading `v` in tags, title = tag, ask the
user to confirm before creating, `gh release create` or else the web UI.

## Packages

Default branch: `master`.

| Package | Tag | Folder | Notes / Latest | Workflow |
|---|---|---|---|---|
| `@corvina/create-corvina-app` (scaffold, main) | `X.Y.Z` | repo root | bare version, generated notes, **Latest** | `publish.yaml` — Publish @corvina/create-corvina-app |
| `corvina-app-charts-lib` (Helm library chart) | `corvina-app-charts-lib-X.Y.Z` | `packages/helm/corvina-app-charts-lib` | scoped to the folder, not Latest | `publish-corvina-app-charts-lib.yaml` — Publish corvina-app-charts-lib Helm chart |
| `@corvina/nestjs-app-common-lib` | `nestjs-app-common-lib-X.Y.Z` | `packages/npm/nestjs-app-common-lib` | scoped to the folder, not Latest | `publish-nestjs-app-common-lib.yaml` — Publish @corvina/nestjs-app-common-lib |

## Notes for this repo

- The charts-lib workflow runs on the tag push, the others on the release being published.
- After publishing, the library workflows open a PR bumping the lib in the app template
  (`src/templates/corvina-app-web/`); it may need approval. Prereleases leave the template alone.
- Old nestjs tags are `nestjs-app-common-lib-vX.Y.Z`: new ones have no `v`.
