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

# Use values from .env file
ENV PORT=${PORT}
ENV NODE_ENV=${NODE_ENV}
ENV PG_DB=${PG_DB}
ENV PG_USER=${PG_USER}
ENV PG_PASSWORD=${PG_PASSWORD}
ENV DB_HOST=${DB_HOST}
ENV DB_PORT=${DB_PORT}
ENV JWT_SECRET=${JWT_SECRET}
ENV SMTP_HOST=${SMTP_HOST}
ENV SMTP_PORT=${SMTP_PORT}
ENV DB_URL=${DB_URL}

# Expose the port from .env
EXPOSE ${PORT}


# Command to run the application
CMD ["npm", "run", "start:prod"]