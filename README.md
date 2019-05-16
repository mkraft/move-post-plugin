### Development setup

1) Install [jq](https://stedolan.github.io/jq/)
2) `npm i`

### Bundle for a release

```bash
make bundle
```

### Development watchers

```bash
MM_ADMIN_USERNAME=sysadmin \
MM_ADMIN_PASSWORD=test123 \
make watch-server
```

```bash
MM_ADMIN_USERNAME=sysadmin \
MM_ADMIN_PASSWORD=test123 \
make watch-webapp
```

### Current Limitations

* Cannot move a post with attachments (coming soon)
* Cannot move a post that is already in a thread

### TODO

- [ ] Conditionally hide menu items that aren't able to be used on mobile view
- [ ] Add ability to move a post to another team
- [ ] Add a UX that also works on mobile web view
