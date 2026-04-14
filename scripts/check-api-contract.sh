#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/nest-admin-frontend/src"
BACKEND_DIR="$ROOT_DIR/nest-admin/src"

FAILED=0

check_pattern() {
  local title="$1"
  local path="$2"
  local include_csv="$3"
  local pattern="$4"
  local has_match=1

  echo "[check] $title"
  if command -v rg >/dev/null 2>&1; then
    if rg -n --glob "*.{$include_csv}" "$pattern" "$path"; then
      has_match=0
    fi
  else
    IFS=',' read -r -a exts <<< "$include_csv"
    local grep_args=("-R" "-n" "-E" "$pattern" "$path")
    for ext in "${exts[@]}"; do
      grep_args=("--include=*.$ext" "${grep_args[@]}")
    done
    if grep "${grep_args[@]}"; then
      has_match=0
    fi
  fi

  if [[ "$has_match" -eq 0 ]]; then
    FAILED=1
    echo "[fail] $title"
  else
    echo "[pass] $title"
  fi
  echo
}

check_pattern "frontend GET wrapped params" "$FRONTEND_DIR" "ts,js,vue" "request\\.get\\([^)]*\\{\\s*params\\s*\\}"
check_pattern "frontend page nested data access" "$FRONTEND_DIR/views" "ts,js,vue" "\\.data\\?\\.data\\?\\.|\\.data\\.data\\."
check_pattern "backend manual code-data wrapper" "$BACKEND_DIR" "ts" "return \\{ code: 0, data:"

if [[ "$FAILED" -ne 0 ]]; then
  echo "API contract checks failed."
  exit 1
fi

echo "All API contract checks passed."
