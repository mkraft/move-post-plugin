PLUGIN_ID=$(cat "./plugin.json" | jq -r '.id')
VERSION=$(cat "./package.json" | jq -r '.version')
BUNDLE_NAME=${PLUGIN_ID}-${VERSION}.tar.gz

TOKEN=$(curl -si -X POST \
  http://localhost:8065/api/v4/users/login \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: 7a1cde93-d994-47b3-af15-5060e23ad305' \
  -H 'cache-control: no-cache' \
  -d "{\"login_id\":\"$MM_USER\",\"password\":\"$MM_PASSWORD\"}" | grep Token | cut -c 8-33)

curl -sX POST \
  http://localhost:8065/api/v4/plugins \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: multipart/form-data' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
  -F plugin=@${PWD}/bundle/${BUNDLE_NAME} \
  -F force=true | jq