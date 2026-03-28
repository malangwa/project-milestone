#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

ensure_dependencies() {
  local dir="$1"
  if [ ! -d "$dir/node_modules" ]; then
    echo "Installing dependencies in $dir..."
    (cd "$dir" && npm install)
  fi
}

ensure_backend_build() {
  if [ ! -f "$ROOT/backend/dist/main.js" ]; then
    echo "Backend build not found. Building backend..."
    (cd "$ROOT/backend" && npm run build)
  fi
}

start_postgres_if_needed() {
  if command -v pg_isready >/dev/null 2>&1 && pg_isready -q; then
    echo "PostgreSQL is already accepting connections."
    return
  fi

  if command -v systemctl >/dev/null 2>&1; then
    echo "Attempting to start PostgreSQL service..."
    if sudo -n systemctl start postgresql >/dev/null 2>&1; then
      echo "PostgreSQL started."
      return
    fi
  fi

  echo "PostgreSQL may need to be started manually before using the app."
}

ensure_dependencies "$ROOT/backend"
ensure_dependencies "$ROOT/web"
ensure_backend_build
start_postgres_if_needed

echo "Starting backend..."
cd "$ROOT/backend"
node dist/main.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend on :3000..."
for i in $(seq 1 15); do
  if lsof -i :3000 | grep -q LISTEN; then
    echo "  Backend up (pid $BACKEND_PID)"
    break
  fi
  sleep 1
done

echo "Starting frontend..."
cd "$ROOT/web"
npm run dev > /tmp/vite.log 2>&1 &
FRONTEND_PID=$!

echo "Waiting for frontend on :5173..."
for i in $(seq 1 15); do
  if lsof -i :5173 | grep -q LISTEN; then
    echo "  Frontend up (pid $FRONTEND_PID)"
    break
  fi
  sleep 1
done

echo ""
echo "  Backend:  http://localhost:3000"
echo "  API docs: http://localhost:3000/api/docs"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
