npx concurrently \
    --names "docker,app,service" \
    "docker-compose up postgresql redis" \
    "cd app && cp -n ./.env.dist ./.env || true && npm i && npm run dev" \
    "cd service && cp -n ./.env.dist ./.env || true && npm i && npm run start:dev"