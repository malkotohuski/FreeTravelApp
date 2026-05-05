const fs = require('fs');
const path = require('path');

const sourcePath = path.resolve(
  __dirname,
  './data/ekatte-2025/ek_atte.json',
);
const outputPath = path.resolve(__dirname, './data/cities.bg.json');

const MAJOR_CITY_POPULARITY = {
  Sofia: 1000,
  Plovdiv: 950,
  Varna: 900,
  Burgas: 850,
  Ruse: 800,
  'Stara Zagora': 780,
  Pleven: 760,
  Sliven: 740,
};

const normalizeSearch = value =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const cleanRegion = regionName =>
  (regionName || '')
    .replace(/^обл\.\s*/i, '')
    .trim();

const getBasePopularity = row => (row?.t_v_m === 'гр.' ? 100 : 0);

const getMajorCityPopularity = displayName =>
  MAJOR_CITY_POPULARITY[displayName] || 0;

const getRowScore = row => {
  const kindPriority = row?.t_v_m === 'гр.' ? 10 : 0;
  const categoryScore = Number.isFinite(row?.category) ? 10 - row.category : 0;

  return kindPriority + categoryScore;
};

const buildNormalizedName = (displayName, bulgarianName) => {
  const forms = [
    normalizeSearch(displayName),
    normalizeSearch(bulgarianName),
  ].filter((value, index, all) => value && all.indexOf(value) === index);

  return forms.join('|');
};

function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const rowsByDisplayName = new Map();

  source.forEach(row => {
    if (!row?.name) {
      return;
    }

    const displayName = (row.name_en || row.name).trim();
    const current = rowsByDisplayName.get(displayName);

    if (!current || getRowScore(row) > getRowScore(current)) {
      rowsByDisplayName.set(displayName, row);
    }
  });

  const dataset = [...rowsByDisplayName.values()]
    .map(row => {
      const displayName = (row.name_en || row.name).trim();

      return {
        name: displayName,
        normalizedName: buildNormalizedName(displayName, row.name),
        region: cleanRegion(row.oblast_name),
        popularity:
          getBasePopularity(row) + getMajorCityPopularity(displayName),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));

  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2) + '\n', 'utf8');
  console.log(`Built ${dataset.length} official city records at ${outputPath}`);
}

main();
