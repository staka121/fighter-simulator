# Even G2 HUD app — dev shortcuts. Run these on the host (they wrap docker compose).
COMPOSE = docker compose
APP_DIR = /workspace/app
PORT   ?= 5173
# Mac LAN IP the phone connects to. Auto-detected; override with `make qr IP=x.x.x.x`.
IP     ?= $(shell ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

# Even simulator (a HOST-side GUI tool — the one exception to "no host tooling";
# there is no glasses rendering off-device without it). Drives official
# store-listing screenshots. `?demo` seeds representative data (DEV-only).
SIM_VER   ?= 0.9.4
SIM_PORT  ?= 9898
SIM_URL   ?= http://localhost:$(PORT)/?demo=1
SHOTS_DIR ?= screenshots

.DEFAULT_GOAL := help
.PHONY: help build up down sh install dev logs qr typecheck sim sim-stop screenshots

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
	# Stop any existing server first, as a SEPARATE step. Keeping the kill out of
	# the start command's shell avoids `pkill -f` matching its own launcher
	# (whose command line would otherwise contain the pattern and self-terminate).
	-$(COMPOSE) exec -T dev bash -lc 'pkill -f "bin/vite" 2>/dev/null; sleep 1'
	$(COMPOSE) exec -d dev bash -lc 'cd $(APP_DIR) && npm run dev > /tmp/vite.log 2>&1'
	@echo "Vite starting -> http://$(IP):$(PORT)"

logs: ## Tail the Vite dev server log
	$(COMPOSE) exec dev bash -lc 'tail -f /tmp/vite.log'

typecheck: ## Type-check the app (tsc --noEmit)
	$(COMPOSE) exec dev bash -lc 'cd $(APP_DIR) && npx tsc --noEmit'

qr: ## Show the QR to preview on the glasses (override with IP=x.x.x.x)
	$(COMPOSE) exec dev bash -lc 'cd $(APP_DIR) && npx evenhub qr --url "http://$(IP):$(PORT)"'

sim: ## Launch the Even simulator on the HOST against the dev server (needs `make dev`)
	@if curl -sf -m1 http://127.0.0.1:$(SIM_PORT)/api/ping >/dev/null 2>&1; then \
		echo "Simulator already running (automation on :$(SIM_PORT))"; \
	else \
		echo "Launching simulator -> $(SIM_URL) (automation on :$(SIM_PORT))"; \
		nohup npx --yes @evenrealities/evenhub-simulator@$(SIM_VER) "$(SIM_URL)" \
			--automation-port $(SIM_PORT) >/tmp/evenhub-sim.log 2>&1 & \
		echo "  started (log: /tmp/evenhub-sim.log). Stop with 'make sim-stop'."; \
	fi

sim-stop: ## Stop the Even simulator
	-@pkill -f "evenhub-simulator" 2>/dev/null; pkill -f "sim-darwin" 2>/dev/null; true
	@echo "Simulator stopped"

screenshots: sim ## Capture RAW store screenshots from the simulator into $(SHOTS_DIR)/
	@SIM_PORT=$(SIM_PORT) SHOTS_DIR=$(SHOTS_DIR) bash tools/sim-screenshots.sh
