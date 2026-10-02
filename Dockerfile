FROM node:24-bookworm-slim
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY . .
RUN pnpm install --frozen-lockfile
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN test -n "$VITE_CLERK_PUBLISHABLE_KEY" && pnpm run build
ENV NODE_ENV=production
ENV PORT=3001
ENV STATIC_DIR=/app/artifacts/ats-resume/dist/public
USER node
EXPOSE 3001
CMD ["node", "artifacts/api-server/dist/index.mjs"]
