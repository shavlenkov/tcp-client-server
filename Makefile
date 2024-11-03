.PHONY: install build run

install:
	@echo "Installing dependencies for client..."
	cd client && npm install
	@echo "Installing dependencies for server..."
	cd server && npm install

build:
	@echo "Building client application..."
	cd client && npm run build
	@echo "Building server application..."
	cd server && npm run build

run: install build
	@echo "Starting server..."
	cd server && npm start &
	@echo "Starting client..."
	cd client && npm start
