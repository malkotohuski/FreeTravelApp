const fs = require('fs');
const path = require('path');
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

const sanitizeCityName = value =>
  value
    .replace(/_/g, ' ')
    .replace(/Ðµ/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCityName = value =>
  sanitizeCityName(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

async function main() {
  const legacySelectorPath = path.resolve(
    __dirname,
    '../../server/Cities/cities.js',
  );

  const source = fs.readFileSync(legacySelectorPath, 'utf8');
  const matches = [...source.matchAll(/t\('([^']+)'\)/g)];
  const uniqueNames = [
    ...new Set(matches.map(match => sanitizeCityName(match[1]))),
  ].filter(Boolean);

  const cityRows = uniqueNames.map(name => ({
    name,
    normalizedName: normalizeCityName(name),
  }));

  await prisma.city.createMany({
    data: cityRows,
    skipDuplicates: true,
  });

  console.log(`Seeded ${cityRows.length} cities from legacy CitySelector.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
