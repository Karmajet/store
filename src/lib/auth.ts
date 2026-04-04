import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Check customer users first
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user) {
          const valid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "customer",
          };
        }

        // Then check admin users
        const admin = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });

        if (admin) {
          const valid = await bcrypt.compare(
            credentials.password,
            admin.passwordHash
          );
          if (!valid) return null;
          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: "admin",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
