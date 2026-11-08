# Secrets map — no secret values stored here

GitHub stores these under **Settings → Secrets and variables → Actions**.

| GitHub secret | What it is | Where to get/rotate the value | Used by |
|---|---|---|---|
| `DEPLOY_HOST` | Azure VM public IP or hostname | Azure CLI / Portal → VM public IP | `deploy` job SSH target |
| `DEPLOY_USER` | SSH username on the VM | Chosen when creating the VM (`azureuser` in our setup) | `deploy` job SSH login |
| `DEPLOY_SSH_KEY` | Private SSH key authorized on the VM | Private key from the deployment key pair; the matching public key lives in the VM's `authorized_keys` | `appleboy/ssh-action` |
| `GHCR_PAT` | GitHub PAT for pulling private GHCR images | GitHub → Developer settings → Personal access tokens | VM-side `docker login ghcr.io` |

## Rules

- Never commit the actual values into this repository.
- The private key must include the full key block, including `-----BEGIN...` and `-----END...` lines.
- Keep the PAT limited to the permissions needed for image pulls, and regenerate it if it expires or is exposed.
- The repository also uses `GITHUB_TOKEN` automatically; it is not a manually configured secret.
- After changing a secret, rerun the failed workflow job.

## Where the values live now

| Secret | Live value location |
|---|---|
| `DEPLOY_HOST` | `20.120.90.87` (recorded in this runbook context; keep IPs current if Azure changes them) |
| `DEPLOY_USER` | `azureuser` |
| `DEPLOY_SSH_KEY` | Local private key file + GitHub Actions secret + authorized VM public key |
| `GHCR_PAT` | GitHub token settings + GitHub Actions secret |
