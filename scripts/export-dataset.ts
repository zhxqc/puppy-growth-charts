/**
 * Reproducible exporter for the puppy-growth-charts open dataset.
 *
 * The canonical breed data lives in the PuppyWeightCalc website repo
 * (web/src/lib/data/static-data.ts). To regenerate:
 *
 *   1. Copy this file to <website-repo>/web/scripts/export-dataset.ts
 *   2. cd <website-repo>/web && OUT_DIR=/path/to/this/repo/data \
 *      node_modules/.bin/ts-node-transpile-only \
 *      --compilerOptions '{"module":"commonjs","moduleResolution":"node"}' \
 *      scripts/export-dataset.ts
 *
 * Output: data/breeds.json, data/growth-curves.json,
 *         data/weekly-tables/<breed-slug>.json, data/meta.json
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { breeds, growthCurves } from '../src/lib/data/static-data';

const OUT = process.env.OUT_DIR || join(__dirname, '..', 'data');
const LB_TO_KG = 0.45359237;
const r1 = (n: number) => Math.round(n * 10) / 10;
const toKg = (lb: number) => r1(lb * LB_TO_KG);

const realBreeds = breeds.filter((b) => !b.isSpecial);

const breedsOut = realBreeds.map((b) => ({
  id: b.id,
  name: b.name,
  slug: b.slug,
  size_category: b.sizeCategory,
  weight_lb: {
    male: { min: b.maleWeightMin, max: b.maleWeightMax },
    female: { min: b.femaleWeightMin, max: b.femaleWeightMax },
    general: { min: b.generalWeightMin, max: b.generalWeightMax },
  },
  weight_kg: {
    male: {
      min: b.maleWeightMin == null ? null : toKg(b.maleWeightMin),
      max: b.maleWeightMax == null ? null : toKg(b.maleWeightMax),
    },
    female: {
      min: b.femaleWeightMin == null ? null : toKg(b.femaleWeightMin),
      max: b.femaleWeightMax == null ? null : toKg(b.femaleWeightMax),
    },
    general: {
      min: b.generalWeightMin == null ? null : toKg(b.generalWeightMin),
      max: b.generalWeightMax == null ? null : toKg(b.generalWeightMax),
    },
  },
  maturity_weeks: b.maturityWeeks,
  page_url: `https://www.puppyweightcalc.com/breeds/${b.slug}-growth-chart`,
}));

const curvesBySize: Record<string, { age_weeks: number; low: number; mid: number; high: number }[]> = {};
for (const c of growthCurves) {
  (curvesBySize[c.sizeCategory] ||= []).push({
    age_weeks: c.ageWeeks,
    low: c.low,
    mid: c.mid,
    high: c.high,
  });
}
for (const k of Object.keys(curvesBySize)) {
  curvesBySize[k].sort((a, b) => a.age_weeks - b.age_weeks);
}

mkdirSync(join(OUT, 'weekly-tables'), { recursive: true });
writeFileSync(join(OUT, 'breeds.json'), JSON.stringify(breedsOut, null, 2) + '\n');
writeFileSync(join(OUT, 'growth-curves.json'), JSON.stringify(curvesBySize, null, 2) + '\n');

let tableCount = 0;
for (const b of realBreeds) {
  if (
    !b.sizeCategory ||
    b.generalWeightMin == null ||
    b.generalWeightMax == null ||
    b.maturityWeeks == null
  ) {
    continue;
  }
  const min = b.generalWeightMin;
  const max = b.generalWeightMax;
  const mid = (min + max) / 2;
  const table = curvesBySize[b.sizeCategory]
    .filter((p) => p.age_weeks <= b.maturityWeeks!)
    .map((p) => {
      const lb = { low: r1(min * p.low), mid: r1(mid * p.mid), high: r1(max * p.high) };
      return {
        age_weeks: p.age_weeks,
        weight_lb: lb,
        weight_kg: { low: toKg(lb.low), mid: toKg(lb.mid), high: toKg(lb.high) },
      };
    });
  writeFileSync(
    join(OUT, 'weekly-tables', `${b.slug}.json`),
    JSON.stringify(
      {
        breed: b.name,
        slug: b.slug,
        size_category: b.sizeCategory,
        adult_weight_lb: { min, max },
        maturity_weeks: b.maturityWeeks,
        page_url: `https://www.puppyweightcalc.com/breeds/${b.slug}-growth-chart`,
        weekly_table: table,
      },
      null,
      2
    ) + '\n'
  );
  tableCount++;
}

writeFileSync(
  join(OUT, 'meta.json'),
  JSON.stringify(
    {
      generated_at: new Date().toISOString().slice(0, 10),
      breed_count: realBreeds.length,
      weekly_table_count: tableCount,
      size_categories: Object.keys(curvesBySize).sort(),
      units: ['lb', 'kg'],
      source: 'https://www.puppyweightcalc.com',
      license: 'CC0-1.0',
    },
    null,
    2
  ) + '\n'
);

console.log(`breeds: ${realBreeds.length}, weekly tables: ${tableCount}`);
