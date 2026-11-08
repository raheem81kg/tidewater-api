# Tidewater Tours API — Runbook

Live service: `http://<vps-ip>:3000` (Express API in Docker on an Azure Ubuntu 24.04 VM).
Pipeline: GitHub Actions `ci` — `test → build → deploy` on every merge to `main`.

## Deploy

Automatic: merge to `main` and the pipeline deploys itself — a failing test stops it
before anything is built or shipped.

Manual: Actions → **ci** → *Run workflow*, enter the image tag to go live (`latest`
or a commit sha). The deploy step SSHs to the VM, pulls `ghcr.io/<you>/tidewater-api:<tag>`
with docker compose, and curls `/health` until it answers (12 tries × 5s — a miss fails
the job red and the runbook's rollback is next).

## Roll back

Images are tagged with the commit sha, so the previous version is always in the registry.

1. Find the previous sha: `git log --oneline` or copy it from an earlier green run.
2. Actions → **ci** → *Run workflow* → tag = that sha → run.
3. The same deploy step re-pulls that image and waits on `/health`; green means the old
   version is serving traffic.

Or by hand on the VM:

```sh
cd ~/tidewater-api
IMAGE_TAG=<previous-sha> docker compose pull server
IMAGE_TAG=<previous-sha> docker compose up -d server
curl -fsS http://localhost:3000/health   # expect {"status":"ok"}
```

## When it fails

- **Red test job** → the pipeline stopped before build; nothing deployed. Read the job log,
  fix, push again.
- **Health check fails after deploy** → `ssh azureuser@<vps-ip>`, then
  `cd ~/tidewater-api && docker compose logs server --tail=50`. Roll back (above) if it's
  live-breaking.
- **Can't reach the box** → check the VM is up: `az vm list -d -o table`. A deallocated VM
  shows `stopped`; `az vm start -g tidewater-rg -n tidewater-vm` brings it back (public IP
  is kept).
- **Secrets wrong** → deploy fails at `docker login` or the ssh step itself; fix the
  `DEPLOY_*` / `GHCR_PAT` Actions secrets and re-run the job.
