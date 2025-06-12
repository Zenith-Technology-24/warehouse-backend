FROM node:21-alpine3.19 AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:21-alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy built application from builder stage
COPY --from=builder /app/js ./js
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Environment variables
ENV PORT=3000
ENV NODE_ENV=production
ENV PG_DB=${PG_DB}
ENV PG_USER=${PG_USER}
ENV PG_PASSWORD=${PG_PASSWORD}
ENV DB_HOST=${DB_HOST}
ENV DB_PORT=${DB_PORT}
ENV JWT_SECRET=${JWT_SECRET}
ENV SMTP_HOST=${SMTP_HOST}
ENV SMTP_PORT=${SMTP_PORT}
ENV DB_URL=${DB_URL}
ENV APP_URL=${APP_URL}
ENV DATABASE_URL=${DATABASE_URL}

# Expose the port
EXPOSE ${PORT}

# Command to run the application
CMD ["node", "js/src/index.js"]