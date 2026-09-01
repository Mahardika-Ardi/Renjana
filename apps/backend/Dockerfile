FROM node:22-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

COPY apps/backend/package.json apps/backend/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json

RUN npm install

COPY apps/backend apps/backend
COPY packages/types packages/types
COPY packages/utils packages/utils

RUN npm run build:packages
RUN npm -w apps/backend run prisma:generate
RUN npm -w apps/backend run build

CMD ["npm", "-w", "apps/backend", "run", "start:prod"]