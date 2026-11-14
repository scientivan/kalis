#!/bin/sh
# Call an OutLayer testnet project over HTTPS (the on-chain path is unreliable on testnet).
# Usage: app/tools/ol-call.sh <project> '<json body>'
# The payment key is read from the OutLayer CLI store and never printed.
set -eu
PROJECT="$1"; BODY="$2"
A=https://testnet-api.outlayer.ai
PK=$(python3 -I -c "import json,os;print(json.load(open(os.path.expanduser('~/.outlayer/testnet/payment-keys.json')))['testnet:scientivan.testnet:payment-key:1'])")
R=$(curl -s -m 30 -X POST "$A/call/scientivan.testnet/$PROJECT" -H "X-Payment-Key: $PK" -H 'Content-Type: application/json' \
  -d "$(python3 -I -c 'import json,sys;b=json.loads(sys.argv[1]);b["async"]=True;print(json.dumps(b))' "$BODY")")
ID=$(printf '%s' "$R" | python3 -I -c "import json,sys;print(json.load(sys.stdin).get('call_id',''))")
[ -n "$ID" ] || { echo "$R"; exit 1; }
i=0
while [ $i -lt 40 ]; do
  S=$(curl -s -m 20 "$A/calls/$ID" -H "X-Payment-Key: $PK")
  case "$S" in *'"pending"'*|*'"running"'*|*'"queued"'*) sleep 8; i=$((i+1));; *) break;; esac
done
printf '%s\n' "$S"
