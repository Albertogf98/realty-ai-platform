#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
WEB_DIR="$ROOT_DIR/web"

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

for tool in docker node pnpm curl nc; do
  command -v "$tool" >/dev/null 2>&1 || fail "Required command not found: $tool"
done

node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
(( node_major >= 20 )) || fail "Node.js 20 or later is required; found $(node --version)."

if docker compose version >/dev/null 2>&1; then
  compose=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose=(docker-compose)
else
  fail "Docker Compose is not available."
fi

docker info >/dev/null 2>&1 || fail "Docker is not running."
[[ -f "$BACKEND_DIR/.env" ]] || fail "Missing backend/.env. Configure it before starting the API."
if [[ ! -f "$WEB_DIR/.env.local" && ! -f "$WEB_DIR/.env" ]]; then
  fail "Missing web/.env.local or web/.env. Configure it before starting the frontend."
fi

if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  printf 'Installing backend dependencies...\n'
  (cd "$BACKEND_DIR" && pnpm install --frozen-lockfile)
fi
if [[ ! -d "$WEB_DIR/node_modules" ]]; then
  printf 'Installing frontend dependencies...\n'
  (cd "$WEB_DIR" && pnpm install --frozen-lockfile)
fi

printf 'Starting PostgreSQL, Memcached, Typesense, and Redis...\n'
(cd "$BACKEND_DIR" && "${compose[@]}" up -d db memcached typesense redis)

wait_for() {
  local name="$1"
  shift
  for _ in {1..60}; do
    if "$@" >/dev/null 2>&1; then
      printf '%s is ready.\n' "$name"
      return 0
    fi
    sleep 2
  done
  fail "$name did not become ready in time."
}

wait_for "PostgreSQL" docker exec realestate-db pg_isready -U admin -d realestate
wait_for "Memcached" nc -z -w 2 127.0.0.1 11212
wait_for "Typesense" curl -fsS --max-time 2 http://127.0.0.1:8109/health
wait_for "Redis" docker exec realestate-redis redis-cli ping

printf 'Generating Prisma client and applying database migrations...\n'
(cd "$BACKEND_DIR" && pnpm exec prisma generate && pnpm exec prisma migrate deploy)

backend_pid=''
web_pid=''

stop_apps() {
  local status=$?
  trap - EXIT INT TERM
  for pid in "$web_pid" "$backend_pid"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  for pid in "$web_pid" "$backend_pid"; do
    if [[ -n "$pid" ]]; then
      wait "$pid" 2>/dev/null || true
    fi
  done
  exit "$status"
}
trap stop_apps EXIT INT TERM

if curl -sS --max-time 2 http://127.0.0.1:4000 >/dev/null 2>&1; then
  printf 'API already responds at http://localhost:4000.\n'
else
  printf 'Starting API at http://localhost:4000...\n'
  (cd "$BACKEND_DIR" && NODE_ENV=development pnpm run start:dev) &
  backend_pid=$!
  wait_for "Backend API" curl -sS --max-time 2 http://127.0.0.1:4000
fi

if curl -sS --max-time 2 http://127.0.0.1:3000 >/dev/null 2>&1; then
  printf 'Frontend already responds at http://localhost:3000.\n'
else
  printf 'Starting frontend at http://localhost:3000...\n'
  (cd "$WEB_DIR" && pnpm run dev) &
  web_pid=$!
  wait_for "Frontend" curl -sS --max-time 2 http://127.0.0.1:3000
fi

printf '\nAll local environments are running. Press Ctrl+C to stop the API and frontend.\n'
printf 'Docker services remain running; stop them with: (cd backend && docker compose down)\n'
if [[ -n "$backend_pid" && -n "$web_pid" ]]; then
  while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$web_pid" 2>/dev/null; do
    sleep 1
  done
  if ! kill -0 "$backend_pid" 2>/dev/null; then
    wait "$backend_pid"
  else
    wait "$web_pid"
  fi
elif [[ -n "$backend_pid" ]]; then
  wait "$backend_pid"
elif [[ -n "$web_pid" ]]; then
  wait "$web_pid"
else
  while true; do sleep 3600; done
fi
