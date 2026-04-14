const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

const normalizeSearch = value =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getCityScore = (city, normalizedSearch) => {
  const normalizedName = normalizeSearch(city.name);

  if (normalizedName === normalizedSearch) {
    return 3;
  }

  if (normalizedName.startsWith(normalizedSearch)) {
    return 2;
  }

  if (normalizedName.includes(normalizedSearch)) {
    return 1;
  }

  return 0;
};

exports.searchCities = async (req, res) => {
  const search = (req.query.search || '').trim();
  const normalizedSearch = normalizeSearch(search);

  try {
    const cities = await prisma.city.findMany({
      where: {
        isActive: true,
        ...(normalizedSearch
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  normalizedName: {
                    contains: normalizedSearch,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: normalizedSearch
        ? [{popularity: 'desc'}, {name: 'asc'}]
        : [{popularity: 'desc'}, {name: 'asc'}],
      take: normalizedSearch ? 20 : 10,
      select: {
        id: true,
        name: true,
        region: true,
        countryCode: true,
      },
    });

    const rankedCities = normalizedSearch
      ? cities
          .sort((a, b) => {
            const aScore = getCityScore(a, normalizedSearch);
            const bScore = getCityScore(b, normalizedSearch);

            if (aScore !== bScore) {
              return bScore - aScore;
            }

            const popularityDiff = (b.popularity || 0) - (a.popularity || 0);
            if (popularityDiff !== 0) {
              return popularityDiff;
            }

            return a.name.localeCompare(b.name, 'bg');
          })
          .slice(0, 10)
      : cities;

    return res.json(rankedCities);
  } catch (error) {
    console.error('searchCities error:', error);
    return res.status(500).json({error: 'Server error'});
  }
};
