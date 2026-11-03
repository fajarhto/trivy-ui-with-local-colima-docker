
# ------------------------
# Build Stage
# ------------------------
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ------------------------
# Serve Stage
# ------------------------
FROM alpine:3.24.3@sha256:be2656061b536c1883c4034790e21d0a09c5aaaf51968b89368a3c0371ea2c9a
USER root

RUN apk upgrade --no-cache && apk add --no-cache nginx && mkdir -p /var/cache/nginx /usr/share/nginx/html /etc/nginx/conf.d
RUN rm -rf /usr/share/nginx/html/*

# Copy build
COPY --from=builder /app/dist /usr/share/nginx/html

# Critical: copy both nginx.conf and default.conf
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

RUN (id fajarhartanto || (addgroup -g 10001 fajarhartanto && adduser -D -u 10001 -G fajarhartanto fajarhartanto)) \
  && chown -R fajarhartanto:fajarhartanto /var/cache/nginx /var/lib/nginx /var/log/nginx

LABEL org.opencontainers.image.source="https://github.com/geek-kb/trivy-ui" \
 org.opencontainers.image.revision="bbef4682f9dfd75b27f36ed313a4070e2e5a6cf6" \
 org.opencontainers.image.version="1.2.0-local.1"

USER fajarhartanto

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
