FROM makeomatic/node:$NODE_VERSION

ENV NCONF_NAMESPACE=SL_TRIGGERS \
  NODE_ENV=$NODE_ENV

ARG token
WORKDIR /src

# pnpm fetch does require only lockfile
COPY --chown=node:node pnpm-lock.yaml package.json ./
RUN corepack enable
RUN \
  apk --update upgrade \
  && apk --update add --virtual .buildDeps git ca-certificates openssl g++ make python3 linux-headers \
  && chown node:node /src \
  && su node -c 'echo "//registry.npmjs.org/:_authToken=${token}" > ~/.npmrc' \
  && su node -c 'cd /src && pnpm install --frozen-lockfile --prod' \
  && su node -c 'rm ~/.npmrc' \
  && apk del .buildDeps \
  && rm -rf \
  /tmp/* \
  /root/.node-gyp \
  /root/.npm \
  /etc/apk/cache/* \
  /var/cache/apk/*

COPY --chown=node:node . /src
USER node

CMD [ "pnpm", "start" ]
