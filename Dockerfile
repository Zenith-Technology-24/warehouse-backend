# Use Node.js LTS (Long Term Support) image as base
FROM node:20-alpine

# Set working directory in container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

RUN npm run build
# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]