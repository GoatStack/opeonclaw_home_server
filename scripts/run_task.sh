#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TASK_FILE="$ROOT_DIR/tasks/inbox.md"
LOG_FILE="$ROOT_DIR/logs/run_task.log"
TIMESTAMP="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

mkdir -p "$ROOT_DIR/logs"

echo "[$TIMESTAMP] run_task start" >> "$LOG_FILE"

echo "[info] root: $ROOT_DIR"
echo "[info] task file: $TASK_FILE"

if [[ ! -f "$TASK_FILE" ]]; then
  echo "[error] task file not found: $TASK_FILE" | tee -a "$LOG_FILE"
  exit 1
fi

echo "[info] current task preview" | tee -a "$LOG_FILE"
sed -n '1,80p' "$TASK_FILE" | tee -a "$LOG_FILE"

echo "[$TIMESTAMP] run_task end" >> "$LOG_FILE"
