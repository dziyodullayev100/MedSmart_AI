FROM node:20-alpine

WORKDIR /app

# Install dependencies first caching layers
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy application files
COPY . .

EXPOSE 5000

# Container Healthcheck mapping strictly via cURL internally
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health/full || exit 1

CMD ["node", "server.js"]
