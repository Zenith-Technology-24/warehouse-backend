import { serve } from "@hono/node-server";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { routes } from "./routes/route";
import { getRandomMessage } from "./generic/egg";
const app = new OpenAPIHono();
const api = new OpenAPIHono(); // Create a new instance for the API routes

api.openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "Respond a message",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json({
      message: "hello",
    });
  }
);

app.route("/api", api);

app.get(
  "/docs",
  swaggerUI({
    url: "/doc",
  })
);

app.doc("/doc", {
  info: {
    title: "Gil Swaggerboy - OpenOten 3.0 Jak Roberto API",
    version: "v1",
    description: getRandomMessage(),
  },
  openapi: "3.1.0",
});

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

routes(app);

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
