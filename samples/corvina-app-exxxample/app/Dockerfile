##### build environment #####
FROM node:lts-alpine AS build

# make the 'app' folder the current working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./

# install project dependencies
RUN npm ci

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

ARG VITE_SERVICE_URL
ENV VITE_SERVICE_URL=${VITE_SERVICE_URL}

# build app for production with minification
RUN npm run build

##### production environment #####
FROM nginx:stable-alpine as prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]