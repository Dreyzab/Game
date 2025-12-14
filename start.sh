#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
FRONT_DIR="$ROOT_DIR"
BACK_DIR="$ROOT_DIR/server"

require_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "❌ Требуется утилита '$1', но она не найдена в PATH."
        exit 1
    fi
}

echo "🔎 Проверяю зависимости (npm, bun)..."
require_cmd npm
require_cmd bun

if [ ! -d "$FRONT_DIR/node_modules" ]; then
    echo "📦 Устанавливаю зависимости фронтенда (npm install)..."
    (cd "$FRONT_DIR" && npm install)
fi

if [ ! -d "$BACK_DIR/node_modules" ]; then
    echo "📦 Устанавливаю зависимости бэкенда (bun install)..."
    (cd "$BACK_DIR" && bun install)
fi

BACK_PID=""
FRONT_PID=""
cleanup() {
    echo -e "\n🛑 Останавливаю dev-сервера..."
    if [ -n "$BACK_PID" ] && kill -0 "$BACK_PID" 2>/dev/null; then
        kill "$BACK_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONT_PID" ] && kill -0 "$FRONT_PID" 2>/dev/null; then
        kill "$FRONT_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

echo "🚀 Запускаю backend (bun run dev) в $BACK_DIR..."
(cd "$BACK_DIR" && bun run dev) &
BACK_PID=$!

echo "🚀 Запускаю frontend (npm run dev -- --host) в $FRONT_DIR..."
(cd "$FRONT_DIR" && npm run dev -- --host) &
FRONT_PID=$!

echo "✅ Оба dev-сервера запущены."
echo "   • Backend: http://localhost:3000"
echo "   • Frontend: http://localhost:5173"
echo "Нажмите Ctrl+C для остановки."

wait $BACK_PID $FRONT_PID

