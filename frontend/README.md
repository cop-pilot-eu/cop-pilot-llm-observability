# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

### Deployment:

Create image and run the container :

```bash
# Build image
docker buildx build --platform=linux/amd64 --no-cache -t cop-pilot-eu/cop-pilot-llm-observability-fe:0.1.0 .

# Run container
docker run --env-file .env --name cop-pilot-llm-observability-fe -p 3000:3000 cop-pilot-eu/cop-pilot-llm-observability-fe:0.1.0

#Push image to registry
docker push cop-pilot-eu/cop-pilot-llm-observability-fe:0.1.0
```
