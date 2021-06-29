FROM node:16

WORKDIR /app

# Copy wait-for.sh for waiting for required services to start
COPY ./scripts/wait-for.sh /usr/local/bin/

# Copy all package files for dependency installs, this is done here to allow
# Docker to cache the npm install steps if none of the dependencies have changed
COPY ./lerna.json ./
COPY ./package.json ./
COPY ./yarn.lock ./
COPY ./packages/contracts/package.json ./packages/contracts/
COPY ./packages/web3-provider/package.json ./packages/web3-provider/
COPY ./packages/graphql/package.json ./packages/graphql/
COPY ./packages/ipfs/package.json ./packages/ipfs/
COPY ./packages/validator/package.json ./packages/validator/
COPY ./packages/messaging-client/package.json ./packages/messaging-client/
COPY ./packages/mobile-bridge/package.json ./packages/mobile-bridge/
COPY ./packages/eventsource/package.json ./packages/eventsource/
COPY ./packages/event-cache/package.json ./packages/event-cache/
COPY ./packages/services/package.json ./packages/services/
COPY ./packages/token/package.json ./packages/token/
COPY ./packages/auth-client/package.json ./packages/auth-client/
COPY ./packages/ip2geo/package.json ./packages/ip2geo/
COPY ./infra/discovery/package.json ./infra/discovery/
COPY ./infra/messaging/package.json ./infra/messaging/
COPY ./infra/ipfs-proxy/package.json ./infra/ipfs-proxy/
COPY ./infra/notifications/package.json ./infra/notifications/
COPY ./infra/growth/package.json ./infra/growth/
COPY ./infra/identity/package.json ./infra/identity/
COPY ./infra/bridge/package.json ./infra/bridge/
COPY ./infra/growth-shared/package.json ./infra/growth-shared/
COPY ./infra/auth-server/package.json ./infra/auth-server/
COPY ./packages/auth-utils/package.json ./packages/auth-utils/

RUN yarn install
