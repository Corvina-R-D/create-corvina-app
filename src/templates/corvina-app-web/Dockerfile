FROM node:20.11.1-alpine3.19 AS frontend-build

# make the 'app' folder the current working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY /app/package*.json ./

# install project dependencies
RUN npm ci

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY /app/. .

ARG VITE_SERVICE_URL
ENV VITE_SERVICE_URL=${VITE_SERVICE_URL}

# build app for production with minification
RUN npm run build

FROM node:20.11.1-alpine3.19 AS backend-build

WORKDIR /usr/src/app

COPY /service/package*.json ./

RUN npm install glob rimraf

RUN npm ci

COPY /service/. .

RUN npm run build

FROM node:20.11.1-alpine3.19 as production

# nestjs application
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY /service/package*.json ./
COPY /service/static-assets ./static-assets
COPY --from=frontend-build /app/dist ./static-assets

RUN npm ci --omit=dev

COPY --from=backend-build /usr/src/app/dist ./dist

# execute nestjs application
CMD ["node", "dist/main"]