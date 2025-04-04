import { Role, User } from "@prisma/client";
import { Next, Context } from "hono";

type RoleOptions = {
  roles: string[];
  all?: boolean; 
};

export const roleMiddleware = (options: RoleOptions) => {
  return async (
    c: Context & { user: Partial<User> & { roles: Role[] } },
    next: Next
  ) => {
    
    const user = c.user;

    if (!user) {
      return c.json({ message: "Unauthorized - No user found" }, 401);
    }

    const hasAccess = options.all
      ? options.roles.every((role) =>
          user.roles.some(
            (userRole: { name: string }) => userRole.name === role
          )
        )
      : options.roles.some((role) =>
          user.roles.some(
            (userRole: { name: string }) => userRole.name === role
          )
        );

    if (!hasAccess) {
      return c.json(
        { message: `Forbidden - Required roles: ${options.roles.join(", ")}` },
        401
      );
    }

    await next();
  };
};
