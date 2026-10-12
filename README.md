# Puppy Growth Charts — Open Dataset

Open dataset of **typical puppy growth weight ranges** for 80 pure dog breeds:
adult weight ranges plus week-by-week estimated weight tables, in both lb and kg.

Built from the reference data behind the free calculator at
[PuppyWeightCalc](https://www.puppyweightcalc.com) — try it live, or jump
straight to a breed's interactive chart, e.g.
[Labrador Retriever growth chart](https://www.puppyweightcalc.com/breeds/labrador-retriever-growth-chart).

## What's inside

```
data/
  breeds.json            # 80 breeds: adult weight ranges (male/female/general),
                         # size category, maturity age, page URL
  growth-curves.json     # growth curves per size category (toy/small/medium/
                         # large/giant): fraction of adult weight at each week
  weekly-tables/
    <breed-slug>.json    # per-breed week-by-week estimated weight table
  meta.json              # generation date, counts, license
scripts/
  export-dataset.ts      # reproducible export script (run against the site repo)
```

## Example

```python
import json

with open("data/weekly-tables/golden-retriever.json") as f:
    goldens = json.load(f)

for row in goldens["weekly_table"]:
    if row["age_weeks"] == 16:
        print(row["weight_kg"])  # {'low': ..., 'mid': ..., 'high': ...}
```

## Methodology

Each breed has an adult weight range (lb) and a size category. Each size
category has a growth curve: the typical fraction of adult weight a puppy has
reached at a given age in weeks. The weekly table is simply:

> `estimated weight at week W = adult weight range × curve fraction at W`

Values are rounded to 1 decimal. Kilograms are converted from pounds
(1 lb = 0.45359237 kg).

The growth-curve approach (nonlinear growth patterns differing by size
category) follows published veterinary research:

- Hawthorne et al., on growth curve differences across dog sizes —
  https://doi.org/10.1093/jn/134.8.2027S
- Salt et al., on canine growth standards and nonlinear curve fitting —
  https://doi.org/10.1371/journal.pone.0182064

These sources support the modeling direction; they are not an independent
accuracy endorsement of every estimated range in this dataset. Breed adult
weight ranges are compiled reference ranges maintained with the
[PuppyWeightCalc](https://www.puppyweightcalc.com/methodology) project.

These are **estimated typical ranges**, not predictions for any individual
puppy. Real growth varies with genetics, diet, health, and environment.

## Disclaimer

This dataset is for informational purposes only. It is not veterinary or
medical advice. If you are concerned about your puppy's growth, consult a
licensed veterinarian.

## Updates

Regenerated from the PuppyWeightCalc reference data whenever the breed list
or curves change. See `data/meta.json` for the generation date.

## License

CC0 1.0 Universal — public domain dedication. Use it for anything, including
commercial purposes, no attribution required (though a link back is
appreciated). See [LICENSE](LICENSE).
