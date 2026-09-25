FROM node:22-slim AS frontend-build

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

FROM node:22-slim AS backend-build

WORKDIR /usr/src/app

COPY /service/package*.json ./

RUN npm ci

COPY /service/. .

RUN npm run build

FROM node:22-slim AS deps

WORKDIR /usr/src/app

COPY /service/package*.json ./

RUN npm ci --omit=dev

FROM gcr.io/distroless/nodejs22-debian13:nonroot AS production

# nestjs application
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY /service/static-assets ./static-assets
COPY --from=frontend-build /app/dist ./static-assets
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=backend-build /usr/src/app/dist ./dist

# execute nestjs application
CMD ["dist/main"]
