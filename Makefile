# Even G2 HUD app — dev shortcuts. Run these on the host (they wrap docker compose).
COMPOSE = docker compose
APP_DIR = /app/hello-hud
PORT   ?= 5173
# Mac LAN IP the phone connects to. Auto-detected; override with `make qr IP=x.x.x.x`.
IP     ?= $(shell ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

.DEFAULT_GOAL := help
.PHONY: help build up down sh install dev logs qr

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-8s\033[0m %s\n", $$1, $$2}'

build: ## Build the Node 22 dev image
	$(COMPOSE) build

up: ## Start the dev container
	$(COMPOSE) up -d

down: ## Stop the dev container
	$(COMPOSE) down

sh: ## Open a shell inside the container
	$(COMPOSE) exec dev bash

install: ## Install project dependencies (npm install)
	$(COMPOSE) exec dev bash -lc 'cd $(APP_DIR) && npm install'

dev: ## (Re)start the Vite dev server (background) in the container
	# Kill any stray dev server first so we always have exactly one on $(PORT).
	$(COMPOSE) exec -d dev bash -lc 'pkill -f vite 2>/dev/null; sleep 1; cd $(APP_DIR) && npm run dev > /tmp/vite.log 2>&1'
	@echo "Vite starting -> http://$(IP):$(PORT)"

logs: ## Tail the Vite dev server log
	$(COMPOSE) exec dev bash -lc 'tail -f /tmp/vite.log'

typecheck: ## Type-check the app (tsc --noEmit)
	$(COMPOSE) exec dev bash -lc 'cd $(APP_DIR) && npx tsc --noEmit'

qr: ## Show the QR to preview on the glasses (override with IP=x.x.x.x)
	$(COMPOSE) exec dev bash -lc 'cd $(APP_DIR) && npx evenhub qr --url "http://$(IP):$(PORT)"'
