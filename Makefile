.PHONY: build zip clean

build:
	npm run build

zip: build
	rm -f extension.zip
	cd dist && zip -r ../extension.zip .

clean:
	rm -rf dist extension.zip
