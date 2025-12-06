# Use Node 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source files
COPY . .

# Build TypeScript if using NestJS
RUN npm run build

# Expose port (must match your app)
EXPOSE 3000

# Start the app
# CMD ["node", "dist/main.js"]
CMD ["npm", "run", "start:dev"]