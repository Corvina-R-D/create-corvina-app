FROM node:20.11.1-alpine3.19 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install glob rimraf

RUN npm ci

COPY . .

RUN npm run build

FROM node:20.11.1-alpine3.19 as production

# nestjs application
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
COPY static-assets ./static-assets

RUN npm ci --omit=dev

COPY --from=development /usr/src/app/dist ./dist

# execute nestjs application
CMD ["node", "dist/main"]