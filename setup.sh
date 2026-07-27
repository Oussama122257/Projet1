#!/usr/bin/env bash
# ContentLoop one-click setup.
# Usage: ./setup.sh
# Requires: Docker (with the compose plugin). Everything else is automated:
# secret generation, image builds, database + migrations, web + workers.
set -euo pipefail
cd "$(dirname "$0")"

say() { printf "\033[1;36m▸ %s\033[0m\n" "$*"; }
fail() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || fail "Docker is required — install it from https://docs.docker.com/get-docker/"
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required (bundled with Docker Desktop)"

gen_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

# 1. Environment: create .env with generated secrets on first run.
if [ ! -f .env ]; then
  say "Creating .env with generated secrets"
  cp .env.example .env
  AUTH=$(gen_secret); ENC=$(gen_secret)
  # Portable in-place edit (GNU/BSD sed differences avoided via temp file)
  awk -v auth="$AUTH" -v enc="$ENC" '
    /^AUTH_SECRET=/     { print "AUTH_SECRET=" auth; next }
    /^ENCRYPTION_KEY=/  { print "ENCRYPTION_KEY=" enc; next }
    { print }
  ' .env > .env.tmp && mv .env.tmp .env
else
  say ".env already exists — keeping it"
fi

# 2. Build and start the full stack (Postgres+pgvector, Redis, migrate, web, workers).
say "Building images and starting the stack (first run takes a few minutes)"
docker compose up -d --build

# 3. Wait for the web app to answer.
say "Waiting for the app to come up"
for i in $(seq 1 60); do
  if curl -fsS http://localhost:3000/api/health >/dev/null 2>&1; then
    echo
    say "ContentLoop is running → http://localhost:3000"
    say "Create your account at http://localhost:3000/register"
    echo
    echo "Next (optional, in .env — then: docker compose up -d):"
    echo "  APIFY_API_TOKEN / APIFY_ACTOR_ID   → content ingestion"
    echo "  ANTHROPIC_API_KEY                  → AI analysis & scoring"
    echo "  R2_* keys                          → cloud media storage"
    echo "  Metricool connects in-app (Integrations page)."
    exit 0
  fi
  sleep 2
done

fail "App did not become healthy in time — check: docker compose logs web migrate"
