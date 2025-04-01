import { User, type Token } from "@prisma/client";
import prisma from "@/generic/prisma";
import { jwtDecoded } from "@/utils/auth";

export class AuthService {
  async createToken(token: string): Promise<Token> {
    const tokenParts = token.split(".");

    if (tokenParts.length !== 3) {
      throw new Error("Invalid token parts.");
    }

    const secret = tokenParts[tokenParts.length - 1];
    const userId = jwtDecoded(token);

    const authUser = await prisma.token.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        token: secret,
      },
      include: {
        user: true,
      },
    });

    return authUser;
  }

  async getToken(
    userId: string,
    token: string
  ): Promise<(Token & { user: Partial<User> }) | null> {
    const authUser = await prisma.token.findFirst({
      where: {
        userId,
        token,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstname: true,
            lastname: true,
            status: true,
            roles: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return authUser;
  }

  async deleteToken(userId: string, token: string): Promise<Token | null> {
    const authUser = await prisma.token.delete({
      where: {
        userId,
        token,
      },
    });

    return authUser;
  }
}
