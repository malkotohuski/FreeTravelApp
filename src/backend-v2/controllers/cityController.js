const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();

const BULGARIAN_CYR_TO_LAT = {
  '\u0430': 'a',
  '\u0431': 'b',
  '\u0432': 'v',
  '\u0433': 'g',
  '\u0434': 'd',
  '\u0435': 'e',
  '\u0436': 'zh',
  '\u0437': 'z',
  '\u0438': 'i',
  '\u0439': 'y',
  '\u043a': 'k',
  '\u043b': 'l',
  '\u043c': 'm',
  '\u043d': 'n',
  '\u043e': 'o',
  '\u043f': 'p',
  '\u0440': 'r',
  '\u0441': 's',
  '\u0442': 't',
  '\u0443': 'u',
  '\u0444': 'f',
  '\u0445': 'h',
  '\u0446': 'ts',
  '\u0447': 'ch',
  '\u0448': 'sh',
  '\u0449': 'sht',
  '\u044a': 'a',
  '\u044c': 'y',
  '\u044e': 'yu',
  '\u044f': 'ya',
};

const BULGARIAN_LAT_TO_CYR = [
  ['sht', '\u0449'],
  ['sh', '\u0448'],
  ['ch', '\u0447'],
  ['ts', '\u0446'],
  ['zh', '\u0436'],
  ['yu', '\u044e'],
  ['ya', '\u044f'],
  ['yo', '\u044c\u043e'],
  ['a', '\u0430'],
  ['b', '\u0431'],
  ['v', '\u0432'],
  ['g', '\u0433'],
  ['d', '\u0434'],
  ['e', '\u0435'],
  ['z', '\u0437'],
  ['i', '\u0438'],
  ['y', '\u0439'],
  ['k', '\u043a'],
  ['l', '\u043b'],
  ['m', '\u043c'],
  ['n', '\u043d'],
  ['o', '\u043e'],
  ['p', '\u043f'],
  ['r', '\u0440'],
  ['s', '\u0441'],
  ['t', '\u0442'],
  ['u', '\u0443'],
  ['f', '\u0444'],
  ['h', '\u0445'],
  ['w', '\u0432'],
  ['q', '\u044f'],
  ['x', '\u043a\u0441'],
  ['c', '\u043a'],
];

const normalizeSearch = value =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const transliterateCyrToLat = value =>
  value
    .split('')
    .map(char => BULGARIAN_CYR_TO_LAT[char] || char)
    .join('');

const transliterateLatToCyr = value => {
  let result = value;

  BULGARIAN_LAT_TO_CYR.forEach(([latin, cyrillic]) => {
    result = result.replaceAll(latin, cyrillic);
  });

  return result;
};

const getSearchVariants = value => {
  const normalizedValue = normalizeSearch(value);

  if (!normalizedValue) {
    return [];
  }

  return [
    normalizedValue,
    normalizeSearch(transliterateCyrToLat(normalizedValue)),
    normalizeSearch(transliterateLatToCyr(normalizedValue)),
  ].filter((variant, index, all) => variant && all.indexOf(variant) === index);
};

const getCityForms = cityName => {
  const normalizedName = normalizeSearch(cityName);

  return [
    normalizedName,
    normalizeSearch(transliterateCyrToLat(normalizedName)),
    normalizeSearch(transliterateLatToCyr(normalizedName)),
  ].filter((variant, index, all) => variant && all.indexOf(variant) === index);
};

const getMatchScore = (cityForm, searchVariant) => {
  if (cityForm === searchVariant) {
    return 3;
  }

  if (cityForm.startsWith(searchVariant)) {
    return 2;
  }

  if (cityForm.includes(searchVariant)) {
    return 1;
  }

  return 0;
};

const getCityScore = (city, searchVariants) => {
  const cityForms = getCityForms(city.name);
  let bestScore = 0;

  searchVariants.forEach(searchVariant => {
    cityForms.forEach(cityForm => {
      bestScore = Math.max(bestScore, getMatchScore(cityForm, searchVariant));
    });
  });

  return bestScore;
};

exports.searchCities = async (req, res) => {
  const search = (req.query.search || '').trim();
  const searchVariants = getSearchVariants(search);

  if (search && search.length < 2) {
    return res.json([]);
  }

  try {
    const cities = await prisma.city.findMany({
      where: {
        isActive: true,
        ...(searchVariants.length
          ? {
              OR: searchVariants.flatMap(searchVariant => [
                {
                  name: {
                    contains: searchVariant,
                    mode: 'insensitive',
                  },
                },
                {
                  normalizedName: {
                    contains: searchVariant,
                  },
                },
              ]),
            }
          : {}),
      },
      orderBy: [{popularity: 'desc'}, {name: 'asc'}],
      take: searchVariants.length ? 200 : 10,
      select: {
        id: true,
        name: true,
        region: true,
        countryCode: true,
        popularity: true,
      },
    });

    const rankedCities = searchVariants.length
      ? cities
          .sort((a, b) => {
            const aScore = getCityScore(a, searchVariants);
            const bScore = getCityScore(b, searchVariants);

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
