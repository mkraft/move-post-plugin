### Development setup

1) Install [jq](https://stedolan.github.io/jq/)
2) `npm i`

### Build

```bash
npm run build
```

### Bundle

```bash
npm run bundle
```

### Deploy

```bash
MM_ADMIN_USERNAME=sysadmin MM_ADMIN_PASSWORD=test123 npm run deploy
```

### Development watcher (build, bundle, and deploy upon src/ and assets/ changes)

```bash
MM_ADMIN_USERNAME=sysadmin MM_ADMIN_PASSWORD=test123 npm run watch
```

### TODO

- [ ] Get files moving successfully, perhaps they need to be re-uploaded?
- [ ] Deal with moving a root thread that itself has child posts
- [ ] Add a configurable string template for the replacement text of the original post in case one wants to edit the original post message to something like `[<moved>](https://community.mattermost.com/private-core/pl/qiao7mwyrfgdbg4idp1ct7kj5z)` instead of deleting it.
- [ ] Conditionally hide menu items that aren't able to be used on mobile view
- [ ] Better UX
- [ ] Add ability to move a post to another team
- [ ] Add a UX that also works on mobile web view
- [ ] Remove the unused assets directory
- [x] Make the plugin configurable to work with permissions so some people can move others posts
- [x] Change the plugin name
