# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# First copy just package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source files
COPY . .

# Copy the root .env file for Vite to use during build
COPY ../.env ./.env

# Build with environment variables from .env file
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
