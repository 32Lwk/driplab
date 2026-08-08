FROM node:20-alpine AS deps
WORKDIR /app
COPY packages/recommender/package.json ./packages/recommender/
COPY packages/web/package.json ./packages/web/
WORKDIR /app/packages/web
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/recommender ./packages/recommender
COPY packages/web ./packages/web
COPY data/catalog/beans.json ./data/catalog/beans.json
COPY scripts/sync-web-beans.mjs ./scripts/sync-web-beans.mjs
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules
WORKDIR /app/packages/web
RUN node ../../scripts/sync-web-beans.mjs && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
