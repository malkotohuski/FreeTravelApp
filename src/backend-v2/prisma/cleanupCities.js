const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

const MAJOR_CITY_POPULARITY = {
  Sofia: 1000,
  Plovdiv: 950,
  Varna: 900,
  Burgas: 850,
  Ruse: 800,
  Stara: 780,
  Pleven: 760,
};

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

const getPopularityBoost = name => {
  const matchedPrefix = Object.keys(MAJOR_CITY_POPULARITY).find(prefix =>
    name.startsWith(prefix),
  );

  return matchedPrefix ? MAJOR_CITY_POPULARITY[matchedPrefix] : 0;
};

async function main() {
  const cities = await prisma.city.findMany({
    orderBy: {id: 'asc'},
    select: {
      id: true,
      name: true,
      popularity: true,
    },
  });

  const seenNames = new Map();
  const duplicates = [];
  let updatedCount = 0;

  for (const city of cities) {
    const sanitizedName = sanitizeCityName(city.name);
    const normalizedName = normalizeCityName(sanitizedName);
    const popularity = Math.max(city.popularity || 0, getPopularityBoost(sanitizedName));

    if (seenNames.has(sanitizedName)) {
      duplicates.push({
        id: city.id,
        name: city.name,
        duplicateOfId: seenNames.get(sanitizedName),
      });
      continue;
    }

    seenNames.set(sanitizedName, city.id);

    if (
      city.name !== sanitizedName ||
      city.popularity !== popularity
    ) {
      await prisma.city.update({
        where: {id: city.id},
        data: {
          name: sanitizedName,
          normalizedName,
          popularity,
        },
      });
      updatedCount += 1;
      continue;
    }

    await prisma.city.update({
      where: {id: city.id},
      data: {normalizedName},
    });
  }

  if (duplicates.length) {
    console.log('Duplicate city names detected after cleanup:');
    duplicates.forEach(duplicate => {
      console.log(
        `- city #${duplicate.id} "${duplicate.name}" duplicates city #${duplicate.duplicateOfId}`,
      );
    });
    console.log(
      'These duplicates were not auto-merged to avoid breaking existing references.',
    );
  }

  console.log(`Updated ${updatedCount} city records.`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
