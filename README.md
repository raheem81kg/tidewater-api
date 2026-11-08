# tidewater-api

A small Express API for the fictional **Tidewater Tours** company, containerised with a
multi-stage Dockerfile and shipped automatically on every merge to `main` by GitHub Actions.

Repo: <https://github.com/raheem81kg/tidewater-api>

## What it is

- `GET /health` → `{ "status": "ok" }` — used by the pipeline, the compose healthcheck, and
  rollback verification.
- `GET /` — banner.
- `GET /api/tours` and `GET /api/tours/:id` — the sample resource.

The app is a pnpm monorepo with one package, `apps/server` (Express 5, TypeScript, tsdown build).

## Run it

```bash
pnpm install          # install deps (postinstall regenerates env types)
pnpm test             # node:test suite — health + tours routes
pnpm dev:server       # dev server on http://localhost:3000
```

## Run it in Docker

```bash
docker build -f apps/server/Dockerfile -t tidewater-api .
docker run -p 3000:3000 tidewater-api
# or: pnpm docker:up   (docker compose, same healthcheck as production)
```

### Why the image is built the way it is

`apps/server/Dockerfile` is **multi-stage**: the `builder` stage has the pnpm toolchain and
devDependencies needed to install and compile (`tsdown → dist/index.mjs`); the `runner`
stage (`node:24-slim` again) receives only the compiled output plus `node_modules`. The
toolchain, test files, and source never ship — smaller image, smaller attack surface,
and the registry pull on the VPS stays fast.

## The pipeline (`.github/workflows/ci.yml`)

Every push/PR runs **test**. Only on `main` (or a manual run) do the next jobs run:

```
test ──► build ──► deploy
         │          │ ssh to the Azure VM
         │          ├─ docker login ghcr.io
         │          ├─ docker compose pull server   (IMAGE_TAG = commit sha)
         │          ├─ docker compose up -d
         │          └─ curl /health until 200 (12×5s) — red if it never comes up
         └─ docker build → ghcr.io/raheem81kg/tidewater-api:<sha> (+ :latest)
```

- **A failing test stops everything** — `build` and `deploy` have `needs: test`.
- **No secrets in the repo** — `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `GHCR_PAT`
  live in Actions secrets; `apps/server/.env` is gitignored.
- **Every merge produces an immutable, sha-tagged image** — that's what makes rollback cheap.

## Deploy + rollback

Full instructions live in [`RUNBOOK.md`](./RUNBOOK.md). Short version: the deploy target is
an Azure Ubuntu 24.04 VM (`Standard_D2as_v4`) running Docker + compose in `~/tidewater-api`;
rolling back is **Actions → ci → Run workflow** with a previous image tag (commit sha).

## Structure

```
tidewater-api/
├── apps/server/
│   ├── src/app.ts        # the Express app (routes; imported by tests and index.ts)
│   ├── src/index.ts      # entry point: app.listen(3000)
│   ├── test/health.test.ts
│   └── Dockerfile
├── docker-compose.yml    # image ref + healthcheck; build section for local dev
├── .github/workflows/ci.yml
├── scripts/setup-vps.sh  # one-time provisioning on a fresh Ubuntu box
└── RUNBOOK.md            # deploy / rollback / failure playbook
```
