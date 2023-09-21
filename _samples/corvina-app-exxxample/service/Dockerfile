FROM node:18-alpine3.16 AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install glob rimraf

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine3.16 as production

# nestjs application
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
COPY static-assets ./static-assets

RUN npm ci --omit=dev

COPY --from=development /usr/src/app/dist ./dist

# install oras
RUN apk update && apk add curl
ENV ORAS_VERSION="1.0.0"
RUN curl -LO "https://github.com/oras-project/oras/releases/download/v${ORAS_VERSION}/oras_${ORAS_VERSION}_linux_amd64.tar.gz"
RUN mkdir -p oras-install/
RUN tar -zxf oras_${ORAS_VERSION}_*.tar.gz -C oras-install/
RUN mv oras-install/oras /usr/local/bin/
RUN rm -rf oras_${ORAS_VERSION}_*.tar.gz oras-install/

# execute nestjs application
CMD ["node", "dist/main"]