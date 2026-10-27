FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
# Seed (chạy bằng tsx) import client Prisma từ mã nguồn đã generate.
COPY --from=build /app/src/generated ./src/generated
COPY docker-entrypoint.sh ./

EXPOSE 3001
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
