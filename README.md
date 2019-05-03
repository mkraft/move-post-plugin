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

### Current Limitations

* Cannot move a post with attachments (coming soon)
* Cannot move a post that is a root post of a thread (coming soon)

### TODO

- [ ] Deal with moving a root thread that itself has child posts
- [ ] Get files moving successfully
- [ ] Conditionally hide menu items that aren't able to be used on mobile view
- [ ] Better UX
- [ ] Add ability to move a post to another team
- [ ] Add a UX that also works on mobile web view
- [ ] Remove the unused assets directory
