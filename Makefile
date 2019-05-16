.PHONY: build-webapp
build-webapp:
	cd webapp && npm run build && cd ..

.PHONY: build-server
build-server:
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

.PHONY: watch-server
watch-server:
	watch 'make build-server && make bundle && make deploy' server/src/

.PHONY: watch-webapp
watch-webapp:
	watch 'make build-webapp && make bundle && make deploy' webapp/src/