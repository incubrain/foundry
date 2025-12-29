# {FRICTION}: this will probably have to be deleted by most template users, can it be extracted?
FROM node:22.21-bookworm

RUN corepack enable && corepack prepare pnpm@10.12.0 --activate

# Build args for Railway environment variables
ARG RAILWAY_DOCKERFILE_PATH=""
ARG NUXT_PUBLIC_SCRIPTS_UMAMI_ANALYTICS_WEBSITE_ID=""
ARG NUXT_PUBLIC_SCRIPTS_UMAMI_ANALYTICS_SCRIPT_INPUT_SRC=""
ARG NUXT_PUBLIC_CONFIG_SOURCE="founder-funnel"
ARG STUDIO_GITHUB_CLIENT_ID=""
ARG STUDIO_GITHUB_CLIENT_SECRET=""
ARG STUDIO_GITHUB_BRANCH_NAME="main"
ARG PORT=3000
ARG HOST=0.0.0.0

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--max-old-space-size=3072"

# Expose as environment variables
ENV RAILWAY_DOCKERFILE_PATH=$RAILWAY_DOCKERFILE_PATH
ENV NUXT_PUBLIC_SCRIPTS_UMAMI_ANALYTICS_WEBSITE_ID=$NUXT_PUBLIC_SCRIPTS_UMAMI_ANALYTICS_WEBSITE_ID
ENV NUXT_PUBLIC_SCRIPTS_UMAMI_ANALYTICS_SCRIPT_INPUT_SRC=$NUXT_PUBLIC_SCRIPTS_UMAMI_ANALYTICS_SCRIPT_INPUT_SRC
ENV NUXT_PUBLIC_CONFIG_SOURCE=$NUXT_PUBLIC_CONFIG_SOURCE
ENV STUDIO_GITHUB_CLIENT_ID=$STUDIO_GITHUB_CLIENT_ID
ENV STUDIO_GITHUB_CLIENT_SECRET=$STUDIO_GITHUB_CLIENT_SECRET
ENV STUDIO_GITHUB_BRANCH_NAME=$STUDIO_GITHUB_BRANCH_NAME
ENV PORT=$PORT
ENV HOST=$HOST


# Set working directory
WORKDIR /app

# Copy package files and workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.json nuxt.config.ts .gitignore ./

# Copy workspace directories
COPY layers ./layers  
COPY modules ./modules  
COPY shared ./shared  
COPY templates ./templates
COPY public ./public
COPY server ./server

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm run build

# Remove dev dependencies
RUN pnpm prune --production

# Reset NODE_OPTIONS for production runtime (lighter memory footprint)
ENV NODE_OPTIONS="--max-old-space-size=512"

# Set the working directory to the Nuxt output
WORKDIR /app/.output

# Expose the port
EXPOSE $PORT

# Start the Nitro server
CMD ["node", "server/index.mjs"]