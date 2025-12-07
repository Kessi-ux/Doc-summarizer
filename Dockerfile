# Use Node 20 Alpine
FROM node:20-alpine

# Fix TLS issues
RUN npm config set strict-ssl false

# Add Poppler for PDF extraction
RUN apk add --no-cache poppler-utils

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Generate prisma client FOR LINUX
RUN npx prisma generate

# Build TypeScript if using NestJS
RUN npm run build

# Expose port (must match your app)
EXPOSE 3000

# Start the app
# CMD ["node", "dist/main.js"]
CMD ["npm", "run", "start:dev"]
