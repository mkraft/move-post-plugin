PLUGIN_ID=$(cat "./plugin.json" | jq -r '.id')
VERSION=$(cat "./plugin.json" | jq -r '.version')
BUNDLE_NAME=${PLUGIN_ID}-${VERSION}.tar.gz

rm -rf bundle/

mkdir -p bundle/${PLUGIN_ID}/webapp
mkdir -p bundle/${PLUGIN_ID}/server

cp plugin.json bundle/${PLUGIN_ID}/
cat plugin.json | jq ".version = \"${VERSION}\"" > bundle/${PLUGIN_ID}/plugin.json

cp -r webapp/dist bundle/${PLUGIN_ID}/webapp
cp -r server/dist bundle/${PLUGIN_ID}/server

cd bundle && tar -cvzf ${BUNDLE_NAME} .