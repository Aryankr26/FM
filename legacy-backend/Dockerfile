FROM node:18-slim

# Install OpenSSL and certs (glibc base avoids musl engine issues)
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Use pnpm v9 to match lockfileVersion 9.0
RUN npm install -g pnpm@9

# Copy manifests first for better layer caching
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma

# Install deps (include devDeps for TypeScript + Prisma), build, then prune to production
RUN pnpm install --frozen-lockfile --prod=false
COPY . .
RUN pnpm build
RUN pnpm prune --prod --ignore-scripts

ENV NODE_ENV=production
EXPOSE 10000

CMD ["node", "dist/index.js"]
