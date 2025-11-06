FROM node:25-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY src ./src

RUN npm run build

FROM node:25-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/logs

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]

FROM node:25-alpine AS development

WORKDIR /app

RUN apk add --no-cache git

COPY package*.json ./
COPY tsconfig.json ./
COPY .eslintrc.json ./
COPY .prettierrc.json ./

RUN npm install

COPY src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]
