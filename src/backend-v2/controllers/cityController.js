const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

const normalizeSearch = value =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

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
            const aStarts = normalizeSearch(a.name).startsWith(normalizedSearch);
            const bStarts = normalizeSearch(b.name).startsWith(normalizedSearch);

            if (aStarts && !bStarts) {
              return -1;
            }

            if (!aStarts && bStarts) {
              return 1;
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
