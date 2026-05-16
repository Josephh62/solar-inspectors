import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const g = globalThis as unknown as { prisma: PrismaClient };

function make() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const adapter = new PrismaLibSql({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma = g.prisma ?? make();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
