[| $dockerComposeCommand := "docker compose up postgresql redis" |]
[| if not .RedisEnabled |]
[| $dockerComposeCommand = "docker compose up postgresql" |]
[| end |]
npx concurrently -k \
    --names "docker,app,service" \
    "[| $dockerComposeCommand |]" \
    "cd app && cp -n ./.env.dist ./.env || true && npm i && npm run dev" \
    "cd service && cp -n ./.env.dist ./.env || true && npm i && npm run start:dev"