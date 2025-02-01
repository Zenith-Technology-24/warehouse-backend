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
    git clone git@github.com:Zenith-Technology-24/aaa-client.git
    cd aaa-client
    ```

2. **Install dependencies:**

    ```bash
    yarn install
    ```

## Environment Variables

Create a `.env` file in the root directory of the project and configure the following environment variables:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=yourpassword
DB_NAME=yourdatabase
JWT_SECRET=yourjwtsecret
```

## SETUP DATABASE USING DOCKER

To create a docker container for mysql and phpmyadmin client. Here's the command:

```bash
docker-compose up -d
````

## RUN SEEDER FOR SUPERADMIN

To generate superadmin user run this command:

```bash
yarn seed:superadmin
```

## MORE

No need to run migration command because we set it to synchronize to true. When updating entity this will allow to automatically run migration. (Not ideal for production)
