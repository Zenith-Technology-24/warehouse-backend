import express, { Application } from "express";
import cors from "cors";
import helmet from 'helmet';

import publicRouter from "./routes/public.routes";
import protectedRouter from "./routes/protected.routes";

import * as swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { getRandomMessage } from "./egg/easter.egg";



const app: Application = express();

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0', // Changed from 'myapi' to 'openapi'
    info: {
      title: 'Gil Swaggerboy - OpenOten 3.0 Jak Roberto API',
      version: '1.0.0',
      description: getRandomMessage(),
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Updated path to include controllers
};


app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Add security headers
app.use(helmet());

app.use(express.static('public'));

app.use(express.json());

// Prefix all public routes with /api/auth
app.use("/api/auth", publicRouter);

// Prefix all protected routes with /api/protected
app.use("/api", protectedRouter);

const swaggerDocs = swaggerJsDoc(swaggerOptions);

//@ts-expect-error owshii
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));


export default app;
