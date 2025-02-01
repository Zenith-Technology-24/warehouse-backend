# Express.js TypeORM API

This project is a RESTful API built using Express.js and TypeORM with MySQL. It follows a modular structure with separate folders for controllers, models, and services.

## Features

- **Authentication**: JWT-based authentication with route protection.
- **TypeORM**: Database management using TypeORM with MySQL.
- **Seeders**: Ability to seed initial data into the database.
- **Routing**: Grouped routes with prefixes for public and protected routes.

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Setup Database using Docker](#setup-database-using-docker)
- [Run Seeder for Superadmin](#run-seeder-for-superadmin)
- [More](#more)

## Installation

To set up this project locally, follow these steps:

1. **Clone the repository:**

    ```bash
    git clone git@github.com:Zenith-Technology-24/warehouse-backend.git
    cd warehouse-backend
    ```

2. **Install dependencies:**

    ```bash
    yarn install
    ```

## Environment Variables

Create a `.env` file in the root directory of the project and configure the following environment variables:

```env
# Server Configuration
PORT=3000

# PostgreSQL Configuration
PG_DB=warehouse
PG_USER=postgres
PG_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_SECRET=yourjwtsecret

# Mail Configuration
SMTP_HOST=localhost
SMTP_PORT=1025
```

## SETUP DATABASE USING DOCKER

To create a docker container for mysql and phpmyadmin client. Here's the command:

```bash
docker-compose up -d
````

## RUN SEEDER FOR SUPERADMIN

To generate superadmin admin user run this command:

```bash
yarn seed:superadmin
```

## Accessing PGAdmin
to access pgadmin locally you can visit `http://localhost:8080`, additionally, the credentials for PGAdmin can be found inside the `docker-compose.yml` file

## MORE

No need to run migration command because we set it to synchronize to true. When updating entity this will allow to automatically run migration. (Not ideal for production)
