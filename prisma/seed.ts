import { PrismaClient } from "@prisma/client";
import { SCHOOLS } from "../lib/schools";

const prisma = new PrismaClient();

async function main() {
  for (const school of SCHOOLS) {
    await prisma.school.upsert({
      where: { cct: school.cct },
      update: { name: school.name, shortName: school.shortName },
      create: { name: school.name, shortName: school.shortName, cct: school.cct },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
