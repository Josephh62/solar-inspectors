import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";
import { DEFAULT_TEMPLATE_SECTIONS } from "../src/types/template";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const existing = await prisma.template.findFirst({ where: { isDefault: true } });
  if (!existing) {
    await prisma.template.create({
      data: {
        name: "Standard Solar Inspection",
        isDefault: true,
        sections: DEFAULT_TEMPLATE_SECTIONS as unknown as object,
      },
    });
    console.log("✓ Created default template");
  } else {
    console.log("Default template already exists, skipping seed.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
