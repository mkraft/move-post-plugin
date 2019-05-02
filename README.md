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

- [ ] Get files moving successfully
- [ ] Only show the menu item for posts the current user authored, alternatively make the plugin configurable to work with permissions so some people can move others posts
- [ ] Change the plugin name
- [ ] Remove the unused assets directory
- [ ] Conditionally hide menu items that aren't able to be used on mobile view
- [ ] Better UX
- [ ] Add ability to move a post to another team
- [ ] Add a UX that also works on mobile web view
- [ ] Add a configurable string template for the replacement text of the original post in case one wants to show something like `[<moved>](https://community.mattermost.com/private-core/pl/qiao7mwyrfgdbg4idp1ct7kj5z)`.
