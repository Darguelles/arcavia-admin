# Dev-server image for the Arcavia admin SPA (Vite).
# Source is bind-mounted in docker-compose for hot reload; the named
# node_modules volume keeps the container's install from being shadowed.
FROM node:22-alpine

WORKDIR /app

# Install deps first so this layer is cached unless the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Port is set explicitly by the compose `command`.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
