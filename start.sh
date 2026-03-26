#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting PostgreSQL..."
sudo systemctl start postgresql

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
