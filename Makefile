install:
	yarn install
	yarn build
	mkdir -p ~/.local/bin
	cp ./dist/main.js ~/.local/bin/sashimi-tanpopo
