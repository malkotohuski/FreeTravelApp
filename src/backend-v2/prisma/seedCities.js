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
  const existingCities = await prisma.city.findMany({
    orderBy: [{name: 'asc'}, {id: 'asc'}],
    select: {
      id: true,
      ekatteCode: true,
      name: true,
    },
  });

  const existingByEkatteCode = new Map();
  const availableLegacyByName = new Map();

  existingCities.forEach(city => {
    if (city.ekatteCode) {
      existingByEkatteCode.set(city.ekatteCode, city);
      return;
    }

    const sameNameCities = availableLegacyByName.get(city.name) || [];
    sameNameCities.push(city);
    availableLegacyByName.set(city.name, sameNameCities);
  });

  await prisma.city.updateMany({
    data: {
      isActive: false,
    },
  });

  let updatedCount = 0;
  let createdCount = 0;

  for (const cityRow of cityRows) {
    const existingByCode = existingByEkatteCode.get(cityRow.ekatteCode);

    if (existingByCode) {
      await prisma.city.update({
        where: {id: existingByCode.id},
        data: {
          ...cityRow,
          isActive: true,
        },
      });
      updatedCount += 1;
      continue;
    }

    const sameNameLegacyCities = availableLegacyByName.get(cityRow.name) || [];
    const legacyCity = sameNameLegacyCities.shift();

    if (legacyCity) {
      await prisma.city.update({
        where: {id: legacyCity.id},
        data: {
          ...cityRow,
          isActive: true,
        },
      });
      updatedCount += 1;
      continue;
    }

    await prisma.city.create({
      data: cityRow,
    });
    createdCount += 1;
  }

  console.log(
    `Synced ${cityRows.length} official cities (${updatedCount} updated, ${createdCount} created).`,
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
