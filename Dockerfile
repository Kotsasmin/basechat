# Base image with Node.js 20.17.0 on Alpine Linux
FROM node:20.17.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install npm version 10.8.2 explicitly
RUN npm install -g npm@10.8.2

# Install dependencies, ignoring peer dependency conflicts
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the Next.js app
RUN npm run build

# ---- Production Stage ----
FROM node:20.17.0-alpine AS runner

WORKDIR /app

# Verify Node and npm versions
RUN node -v
RUN npm -v

# Copy only necessary files from the builder stage
COPY --from=builder /app/.next .next
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/public public
COPY --from=builder /app/package.json package.json

# Expose port 3000 to make it accessible externally
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production

# Set the IP to bind
CMD ["npm", "run", "start"]