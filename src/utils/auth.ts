import { sign, verify, decode } from "hono/jwt";
import type { Role, User } from "@prisma/client";
import type { SignatureKey } from "hono/utils/jwt/jws";
import { AuthService } from "@/services/auth.service";
import type { JWTPayload } from "hono/utils/jwt/types";
import prisma from "@/generic/prisma";

const authService = new AuthService();

export const jwtSign = async (user: User & {roles: Role[]}): Promise<string | null> => {
  const payload = {
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, 
    roles: user.roles.map((role) => role.name)
  };
  
  
  await prisma.token.deleteMany({
    where: {
      userId: user.id
    }
  });
  
  const token = await sign(payload, process.env.JWT_SECRET as SignatureKey);
  await authService.createToken(token);
  return token;
};

export const jwtVerify = async (token: string): Promise<JWTPayload> => {
  const verified = await verify(token, process.env.JWT_SECRET as SignatureKey);
  return verified;
};

export const jwtDecoded = (token: string): string => {
  const { payload } = decode(token);
  const sub: string = (payload as { sub: string }).sub;
  return sub;
};
