import { AuthService } from "@/services/auth.service";
import { jwtDecoded, jwtVerify } from "@/utils/auth";
import { User } from "@prisma/client";
import { Context, Next } from "hono";

const authService = new AuthService();

export async function authMiddleware(
  c: Context & { user: Partial<User>; token: string | null },
  next: Next
) {
  const { authorization } = c.req.header();

  if (!authorization) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const _token: string = authorization.split(" ")[1];
  const _sub: string | null = jwtDecoded(_token);

  try {
    await jwtVerify(_token);
  } catch (error) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!_sub) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const secret = _token.split(".")[2];

  const token = await authService.getToken(_sub, secret);

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = token.user;

  c.user = user;
  c.token = token.token;

  return next();
}
