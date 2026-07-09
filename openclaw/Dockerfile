# OpenClaw gateway image for Reelay.
# The assistant controls the pipeline only through the reelayctl CLI (copied below),
# so the container needs python3 to run it plus Node for OpenClaw itself.
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw. Verify the current install command at https://docs.openclaw.ai
# (their one-liner installs Node + OpenClaw; on this Node base the npm package is enough).
RUN npm install -g openclaw || (curl -fsSL https://openclaw.ai/install.sh | bash)

# The only command the assistant is allowed to run.
COPY backend/reelayctl /usr/local/bin/reelayctl
RUN chmod +x /usr/local/bin/reelayctl

CMD ["openclaw", "gateway"]
