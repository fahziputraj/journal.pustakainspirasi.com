#!/usr/bin/env bash
# Public route status matrix for the PIM OJS install (anonymous requests only).
# Usage: bash tools/qa/live-routes.sh [https://journal.pustakainspirasi.com/index.php]
# Exits 1 on any 5xx, or when a signed-out /{journal}/dashboard does not redirect to login.
set -u
base="${1:-https://journal.pustakainspirasi.com/index.php}"
status=0
check() {
  local path="$1" result code location
  result=$(curl -s -o /dev/null -A "Mozilla/5.0 (PIM route check)" -w '%{http_code} %{redirect_url}' "$base/$path")
  code=${result%% *}
  location=${result#* }
  printf '%-34s %s %s\n' "$path" "$code" "$location"
  if [[ "$code" == 5* ]]; then status=1; fi
  if [[ "$path" == */dashboard ]] && { [[ "$code" != 302 ]] || [[ "$location" != *"/login?source="* ]]; }; then
    echo "  ^ expected a 302 redirect to login with source" >&2
    status=1
  fi
}
for journal in mbj mcj mcsj mmj mpj; do
  for page in index about about/editorialMasthead about/submissions issue/archive issue/current search login user/register dashboard; do
    check "$journal/$page"
  done
done
check index/index
check index/login
exit $status
