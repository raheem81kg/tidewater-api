# Tidewater Tours API — Runbook

## Deploy

Every merge to `main` deploys itself: `test → build → push to GHCR → ssh deploy → /health check`.
To deploy by hand: Actions → **ci** → *Run workflow*, enter the image tag you want live
(`latest` or a commit sha).

On the server (one-time setup): `git clone <repo>`, then create `apps/server/.env` if you want
env overrides (the app runs fine with none).

## Roll back

Images are tagged with the commit sha, so the previous image is still in the registry.

1. Find the previous sha: `git log --oneline -2` (or copy it from the earlier green run).
2. Actions → **ci** → *Run workflow* → tag = the previous sha → run.
3. The deploy step re-pulls that image and waits for `/health` — green means the old
   version is serving traffic.

Or by hand on the server:

```sh
cd ~/tidewater-api
IMAGE_TAG=<previous-sha> docker compose pull server && IMAGE_TAG=<previous-sha> docker compose up -d server
curl -fsS http://localhost:3000/health
```

## When it fails

- **Red test** → the pipeline stops before build; nothing is deployed. Read the `test` job log.
- **Health check fails after deploy** → the deploy job exits red; roll back (above) and check
  `docker compose logs server`.
