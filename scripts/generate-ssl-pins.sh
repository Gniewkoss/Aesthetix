#!/usr/bin/env bash
# Print SPKI SHA-256 pins for a host (default: Supabase project URL host).
# Usage: ./scripts/generate-ssl-pins.sh [hostname]

set -euo pipefail
HOST="${1:-krasjpoxoilwtmovjuho.supabase.co}"

echo "Pins for ${HOST} (update plugins/sslPinningPins.js):"
echo

openssl s_client -connect "${HOST}:443" -servername "${HOST}" -showcerts </dev/null 2>/dev/null \
  | awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/{ if (/BEGIN/) n++; if (n>0) print }' \
  | while read -r line; do
      if [[ "$line" == "-----BEGIN CERTIFICATE-----" ]]; then cert=""
      elif [[ "$line" == "-----END CERTIFICATE-----" ]]; then
        pin=$(printf '%s\n' "$cert" | openssl x509 -pubkey -noout 2>/dev/null \
          | openssl pkey -pubin -outform der 2>/dev/null \
          | openssl dgst -sha256 -binary | openssl enc -base64)
        echo "  ${pin}"
      else cert+="${line}"$'\n'
      fi
    done
