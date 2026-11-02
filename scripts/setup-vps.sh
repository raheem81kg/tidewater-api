#!/usr/bin/env bash
# One-time VPS setup: Docker + compose plugin + the repo checkout the pipeline deploys into.
# Usage on a fresh Ubuntu 24.04 box:
#   bash setup-vps.sh https://github.com/<you>/tidewater-api.git
set -e

REPO_URL="${1:?Usage: bash setup-vps.sh <repo-git-url>}"

# Docker + the compose plugin, from Docker's own packages (not Ubuntu's older snap).
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"

# The deploy job `cd`s here and runs `docker compose pull && up -d`. It only needs the
# compose file plus the registry image — a private repo can't be cloned without a deploy
# key, so clone if we can and copy docker-compose.yml over SSH otherwise.
if git clone "$REPO_URL" ~/tidewater-api 2>/dev/null; then
  echo "Repo cloned to ~/tidewater-api"
else
  mkdir -p ~/tidewater-api
  echo "Could not clone (private repo needs a deploy key on GitHub)."
  echo "Copy just what the deploy needs:  scp docker-compose.yml ${USER}@<this-ip>:~/tidewater-api/"
fi

# Registry auth is done by the pipeline itself (GHCR_PAT secret); nothing else is needed.
echo
echo "Done. Log out and back in so the 'docker' group applies to this user,"
echo "then add DEPLOY_HOST (this box), DEPLOY_USER ($USER), DEPLOY_SSH_KEY and GHCR_PAT"
echo "to the repo's Actions secrets and push to main."
