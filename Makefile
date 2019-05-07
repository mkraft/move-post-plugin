.PHONY: build
build:
	cd webapp && npm run build && cd ..
	mkdir -p server/dist;
	cd server/src && env GOOS=linux GOARCH=amd64 go build -o ../dist/plugin-linux-amd64;
	cd server/src && env GOOS=darwin GOARCH=amd64 go build -o ../dist/plugin-darwin-amd64;
	cd server/src && env GOOS=windows GOARCH=amd64 go build -o ../dist/plugin-windows-amd64;

.PHONY: bundle
bundle:
	./bundle.sh

.PHONY: deploy
deploy:
	./deploy.sh

.PHONY: watch
watch:
	watch 'make build && make bundle && make deploy' webapp/src/ assets/ server/src/