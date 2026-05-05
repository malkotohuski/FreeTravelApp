const fs = require('fs');
const path = require('path');
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const officialDatasetPath = path.resolve(
    __dirname,
    './data/cities.bg.json',
  );

  const cityRows = JSON.parse(fs.readFileSync(officialDatasetPath, 'utf8'));

  await prisma.city.updateMany({
    data: {
      isActive: false,
    },
  });

  for (const cityRow of cityRows) {
    await prisma.city.upsert({
      where: {name: cityRow.name},
      update: {
        ...cityRow,
        isActive: true,
      },
      create: cityRow,
    });
  }

  console.log(`Synced ${cityRows.length} cities from official EKATTE dataset.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
