FROM node:21-alpine3.19

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


# Set working directory in container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build it
RUN yarn build


# Expose the port from .env
EXPOSE ${PORT}


# Command to run the application
CMD ["yarn", "start:prod"]