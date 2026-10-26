# Releases

## What lives where

- `CHANGELOG.md` (repo root) is generated. When a release is cut, release-it writes the version's
  section from the conventional commits. Never edit it by hand, and never add a `## Unreleased`
  section: the generated section would duplicate it.
- `docs/releases/v<version>-upgrade.md` holds the hand-written notes for one version. Write it
  before the cut. [v0.10.0-upgrade.md](v0.10.0-upgrade.md) is the model.
- `layer/LICENSE.md` ships in the npm package; `LICENSE.md` at the root is the same MIT text for
  the repository.

## An upgrade guide's sections

- **Breaking**: every change a consumer must act on, which consumers it hits, and what they change.
  The consumer bumps work from this list. Write "None." when there are none.
- **New** and **Fixed**: optional, for what a consumer may want to adopt or stop working around.
- **Deploy checklist (per site)**: the steps that take each consumer live on the version.

## Cutting a release

`pnpm layer:release` (release-it) runs `pnpm verify`, bumps `layer/package.json`, runs the tests,
writes the changelog section, commits `chore(release): v<version>` and tags `v<version>`, all
locally. It never pushes, creates the GitHub release or publishes to npm. Those are separate steps
of the release, each run on purpose after the cut is checked.

`pnpm layer:release:dry` is not side-effect free: it can run `npm version` and bump the root
`package.json`. Run `git status` after it and restore anything it changed.
