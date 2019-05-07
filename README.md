### Development setup

1) Install [jq](https://stedolan.github.io/jq/)
2) `npm i`

### Build

```bash
make build
```

### Bundle

```bash
make bundle
```

### Deploy

```bash
MM_ADMIN_USERNAME=sysadmin MM_ADMIN_PASSWORD=test123 make deploy
```

### Development watcher (build, bundle, and deploy upon changes in webapp/src/ and assets/)

```bash
MM_ADMIN_USERNAME=sysadmin MM_ADMIN_PASSWORD=test123 make watch
```

### Current Limitations

* Cannot move a post with attachments (coming soon)
* Cannot move a post that is a root post of a thread (coming soon)

### TODO

- [ ] Conditionally hide menu items that aren't able to be used on mobile view
- [ ] Add ability to move a post to another team
- [ ] Add a UX that also works on mobile web view