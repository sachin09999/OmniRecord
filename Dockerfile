# Stage 1: Build React & Vite Application
FROM node:20-alpine AS build-stage
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy project source files
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production Web Server using Nginx Alpine
FROM nginx:alpine AS production-stage

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
