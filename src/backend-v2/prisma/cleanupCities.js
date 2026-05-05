const fs = require('fs');
const path = require('path');
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

const datasetPath = path.resolve(__dirname, './data/cities.bg.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const datasetByName = new Map(dataset.map(city => [city.name, city]));

const normalizeSearch = value =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

async function main() {
  const cities = await prisma.city.findMany({
    orderBy: {id: 'asc'},
    select: {
      id: true,
      name: true,
      normalizedName: true,
      region: true,
      popularity: true,
    },
  });

  let updatedCount = 0;

  for (const city of cities) {
    const datasetCity = datasetByName.get(city.name);
    const nextNormalizedName =
      datasetCity?.normalizedName || normalizeSearch(city.name);
    const nextRegion = datasetCity?.region || city.region;
    const nextPopularity = Math.max(
      city.popularity || 0,
      datasetCity?.popularity || 0,
    );

    if (
      city.normalizedName !== nextNormalizedName ||
      city.region !== nextRegion ||
      city.popularity !== nextPopularity
    ) {
      await prisma.city.update({
        where: {id: city.id},
        data: {
          normalizedName: nextNormalizedName,
          region: nextRegion,
          popularity: nextPopularity,
        },
      });
      updatedCount += 1;
    }
  }

  console.log(`Updated ${updatedCount} city records from official dataset.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
