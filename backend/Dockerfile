# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package manager files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build TypeScript
RUN pnpm run build

# Generate Prisma client
RUN pnpm prisma generate

# Expose port (change if your app uses a different port)
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
