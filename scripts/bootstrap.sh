#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[bootstrap] project root: $ROOT_DIR"
mkdir -p "$ROOT_DIR/tasks" "$ROOT_DIR/logs" "$ROOT_DIR/scripts" "$ROOT_DIR/prompts" "$ROOT_DIR/src" "$ROOT_DIR/config" "$ROOT_DIR/docs"

echo "[bootstrap] done"
