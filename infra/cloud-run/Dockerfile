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
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules
WORKDIR /app/packages/web
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/web/public ./packages/web/public
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./packages/web/.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "packages/web/server.js"]
