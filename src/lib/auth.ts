import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: false,
    schema: {
      user: schema.authUser,
      session: schema.authSession,
      account: schema.authAccount,
      verification: schema.authVerification,
      jwks: schema.authJwks,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
        defaultValue: "participant",
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      instagram: {
        type: "string",
        required: false,
        input: true,
      },
      instagramWarningSeen: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: false,
      },
      totalPoints: {
        type: "number",
        required: false,
        input: false,
        defaultValue: 0,
      },
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  plugins: [jwt()],

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              role: "participant",
              totalPoints: 0,
              instagramWarningSeen: false,
            },
          };
        },
      },
    },
  },

  // Impede que a role seja alterada via signUp
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  },
});

export async function getAdminByEmail(email: string) {
  const [admin] = await db
    .select()
    .from(schema.authUser)
    .where(eq(schema.authUser.email, email))
    .limit(1);
  return admin ?? null;
}
