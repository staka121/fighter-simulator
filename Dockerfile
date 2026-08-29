# The Even Hub tooling targets Node 22. Keep it isolated here instead of
# installing Node 22 on the host.
#
# The CLI, SDK and simulator all come in as project dependencies via
# `npm install` (see hello-hud/package.json), so nothing is installed globally
# here. Run the CLI through the project, e.g. `npx evenhub qr ...`.
FROM node:22-bookworm

WORKDIR /app

# Vite dev server port. The phone (Even app) reaches this over the LAN.
EXPOSE 5173

# Keep an interactive shell available (run scaffolding / npm run dev inside it).
CMD ["bash"]
