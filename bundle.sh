PLUGIN_ID=$(cat "./plugin.json" | jq -r '.id')
VERSION=$(cat "./package.json" | jq -r '.version')
BUNDLE_NAME=${PLUGIN_ID}-${VERSION}.tar.gz
rm -rf bundle/
mkdir -p bundle/${PLUGIN_ID} 
cp plugin.json bundle/${PLUGIN_ID}/
cat plugin.json | jq ".version = \"${VERSION}\"" > bundle/${PLUGIN_ID}/plugin.json
cp -r dist/* bundle/${PLUGIN_ID}
cd bundle && tar -cvzf ${BUNDLE_NAME} .
cp ${BUNDLE_NAME} ~/Desktop