const fs = require('fs');
const path = require('path');
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

const datasetPath = path.resolve(__dirname, './data/cities.bg.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const datasetByEkatteCode = new Map(
  dataset.map(city => [city.ekatteCode, city]),
);

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
      ekatteCode: true,
      name: true,
      normalizedName: true,
      region: true,
      popularity: true,
    },
  });

  let updatedCount = 0;

  for (const city of cities) {
    const datasetCity = city.ekatteCode
      ? datasetByEkatteCode.get(city.ekatteCode)
      : null;
    const nextNormalizedName =
      datasetCity?.normalizedName || normalizeSearch(city.name);
    const nextRegion = datasetCity?.region || city.region;
    const nextPopularity = Math.max(
      city.popularity || 0,
      datasetCity?.popularity || 0,
    );
    const nextEkatteCode = datasetCity?.ekatteCode || city.ekatteCode;

    if (
      city.ekatteCode !== nextEkatteCode ||
      city.normalizedName !== nextNormalizedName ||
      city.region !== nextRegion ||
      city.popularity !== nextPopularity
    ) {
      await prisma.city.update({
        where: {id: city.id},
        data: {
          ekatteCode: nextEkatteCode,
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
