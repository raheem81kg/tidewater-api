# Nine-step notes — GitHub Actions

*(Project: tidewater-api — pipeline in `.github/workflows/ci.yml`)*

## 1. What it is

GitHub Actions is the CI/CD runner built into the repository: YAML files under
`.github/workflows/` describe jobs made of steps, and GitHub runs them on hosted VMs
when events happen (push, pull request, manual dispatch). In this project one `ci.yml`
runs three jobs — test, build, deploy — on every merge to `main`.

## 2. Why I chose it

The pipeline lives in the same repo as the code — no extra service, no extra account,
free minutes on a public/student repo, and it talks natively to GHCR (the registry) via
`GITHUB_TOKEN`. Alternatives (Jenkins, GitLab CI) would have meant hosting or moving
the code.

## 3. How it works

An **event** triggers a **workflow**, which runs **jobs** on a **runner** (`ubuntu-latest`
hosted VM). Jobs run in parallel unless sequenced — mine are chained with `needs:` so
`build` only runs when `test` is green and `deploy` only when `build` is green. Each job
is a fresh VM: the only thing shared between them is the pushed image and the repo files.

## 4. Setup

One file: `.github/workflows/ci.yml` with `on:` triggers (`push`, `pull_request`,
`workflow_dispatch` for manual/rollback runs), a `permissions:` block granting
`packages: write` so `GITHUB_TOKEN` can push to GHCR, and the three jobs. Secrets
(`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `GHCR_PAT`) are set in repo Settings —
never in the file itself.

## 5. Internals

- `GITHUB_TOKEN` is an auto-issued credential scoped to the run — that's how the build
  job authenticates to `ghcr.io` with no PAT.
- `needs:` builds a DAG of jobs; a failed job marks dependents "skipped" — that skip is
  exactly why a red test can never reach the deploy VM.
- `workflow_dispatch` inputs become `${{ inputs.tag }}` — the rollback path reuses the
  same deploy code with a different tag.
- Artifacts/job summaries (like the `.dockerbuild` record) are how steps hand evidence
  up to the run page.

## 6. Limits

Free tiers cap monthly runner minutes (private repos eat them fastest); `ubuntu-latest`
is a moving label — its image changes over time, which can change tool versions under
you (pin a real version if that matters). Hosted runners are ephemeral and shared:
nothing persists, builds start cold, and you're inside GitHub's queue at busy times.

## 7. Logs

Every job expands into per-step logs: the failing step shows its command output (Node's
test runner prints failed assertions inline). `docker build` exposes each layer's
log. For debugging a stuck run: Actions → run → job → the grey step rows; a job summary
can hold human-readable build evidence.

## 8. Failure modes

The ones that actually bit me: `SkuNotAvailable` isn't a CI failure but kills the deploy
target anyway; a private GHCR package makes `docker pull` fail on the VM without the
`GHCR_PAT` secret; an env file that exists locally but is gitignored made tests pass on
my machine and fail in CI — the clean-checkout repro exposed it. Tag `latest` drifting
is why deploys use the immutable sha tag.

## 9. Alternatives

GitLab CI is the closest analogue (also YAML-in-repo, also a free registry); Jenkins is
self-hosted power at real ops cost; CircleCI/Travis are paid variants of the same model.
For a solo project with the repo already on GitHub, Actions removed the most moving
parts — same runner, same registry, same secrets store.
