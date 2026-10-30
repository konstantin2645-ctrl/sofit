# syntax=docker/dockerfile:1
# Pages are prerendered from the database, so `next build` runs when the
# container starts (after migrations and seed), not while the image is built.
FROM node:22-bookworm-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN mkdir -p storage/uploads .next && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run build && NODE_ENV=production npm start"]
