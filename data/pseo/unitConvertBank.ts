export const UNIT_CONVERT_BANK_SLUG = "unit-convert";
export const UNIT_CONVERT_BANK_HUB_PATH = "/tools/unit-convert-bank";

export type UnitConvertTemplate = {
  slug: string;
  phrase: string;
  phraseSlug: string;
  titlePattern: string;
  descriptionPattern: string;
  introPattern: string;
};

export type UnitConvertEntity = {
  key: string;
  name: string;
  sourceUnit: string;
  targetUnit: string;
  category: string;
  formula: string;
  toolSlug: string;
  bestFor: string;
  notes: string;
  priority: number;
};

type UnitDefinition = {
  label: string;
  slug: string;
  toBase: number;
};

type UnitFamily = {
  category: string;
  useCase: string;
  notes: string;
  units: UnitDefinition[];
};

function formatRatio(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) {
    return value.toExponential(6);
  }
  return value.toFixed(8).replace(/\.?0+$/, "");
}

function temperatureFormula(source: string, target: string): string {
  if (source === "Celsius" && target === "Fahrenheit") return "Fahrenheit = (Celsius * 9/5) + 32";
  if (source === "Fahrenheit" && target === "Celsius") return "Celsius = (Fahrenheit - 32) * 5/9";
  if (source === "Celsius" && target === "Kelvin") return "Kelvin = Celsius + 273.15";
  if (source === "Kelvin" && target === "Celsius") return "Celsius = Kelvin - 273.15";
  if (source === "Fahrenheit" && target === "Kelvin") {
    return "Kelvin = (Fahrenheit - 32) * 5/9 + 273.15";
  }
  if (source === "Kelvin" && target === "Fahrenheit") {
    return "Fahrenheit = (Kelvin - 273.15) * 9/5 + 32";
  }
  return `${target} = ${source}`;
}

function buildLinearFormula(source: UnitDefinition, target: UnitDefinition): string {
  const ratio = source.toBase / target.toBase;
  return `${target.label} = ${source.label} * ${formatRatio(ratio)}`;
}

const unitFamilies: UnitFamily[] = [
  {
    category: "length",
    useCase: "design dimensions, product specs, and map distances",
    notes: "Keep enough decimal precision for measurement-sensitive outputs.",
    units: [
      { label: "mm", slug: "mm", toBase: 0.001 },
      { label: "cm", slug: "cm", toBase: 0.01 },
      { label: "meters", slug: "m", toBase: 1 },
      { label: "km", slug: "km", toBase: 1000 },
      { label: "inches", slug: "in", toBase: 0.0254 },
      { label: "feet", slug: "ft", toBase: 0.3048 },
      { label: "yards", slug: "yd", toBase: 0.9144 },
      { label: "miles", slug: "mi", toBase: 1609.344 },
    ],
  },
  {
    category: "weight",
    useCase: "fitness tracking, shipping weights, and food prep",
    notes: "Apply context-aware rounding based on scale precision.",
    units: [
      { label: "mg", slug: "mg", toBase: 0.001 },
      { label: "grams", slug: "g", toBase: 1 },
      { label: "kg", slug: "kg", toBase: 1000 },
      { label: "oz", slug: "oz", toBase: 28.349523125 },
      { label: "lbs", slug: "lb", toBase: 453.59237 },
      { label: "stone", slug: "stone", toBase: 6350.29318 },
      { label: "metric tons", slug: "ton", toBase: 1000000 },
    ],
  },
  {
    category: "volume",
    useCase: "fuel planning, recipe scaling, and fluid handling",
    notes: "US customary and metric systems differ, so confirm unit system first.",
    units: [
      { label: "ml", slug: "ml", toBase: 0.001 },
      { label: "liters", slug: "l", toBase: 1 },
      { label: "cups", slug: "cup", toBase: 0.2365882365 },
      { label: "pints", slug: "pt", toBase: 0.473176473 },
      { label: "quarts", slug: "qt", toBase: 0.946352946 },
      { label: "gallons", slug: "gal", toBase: 3.785411784 },
      { label: "fl oz", slug: "floz", toBase: 0.0295735295625 },
    ],
  },
  {
    category: "temperature",
    useCase: "weather checks, cooking, and technical references",
    notes: "Temperature conversions require offset terms, not only multipliers.",
    units: [
      { label: "Celsius", slug: "c", toBase: 1 },
      { label: "Fahrenheit", slug: "f", toBase: 1 },
      { label: "Kelvin", slug: "k", toBase: 1 },
    ],
  },
  {
    category: "area",
    useCase: "real estate, room layouts, and land planning",
    notes: "Use consistent unit labels in contracts and reports.",
    units: [
      { label: "sq ft", slug: "sqft", toBase: 1 },
      { label: "sq m", slug: "sqm", toBase: 10.7639104167097 },
      { label: "sq yards", slug: "sqyd", toBase: 9 },
      { label: "acres", slug: "acre", toBase: 43560 },
      { label: "hectares", slug: "hectare", toBase: 107639.104167097 },
      { label: "sq inches", slug: "sqin", toBase: 1 / 144 },
    ],
  },
  {
    category: "speed",
    useCase: "travel pacing, training logs, and route comparisons",
    notes: "Speed units can represent average or instantaneous values.",
    units: [
      { label: "mph", slug: "mph", toBase: 1 },
      { label: "km/h", slug: "kmh", toBase: 0.621371192237334 },
      { label: "m/s", slug: "ms", toBase: 2.2369362920544 },
      { label: "knots", slug: "kn", toBase: 1.15077944802354 },
      { label: "ft/s", slug: "fts", toBase: 0.681818181818182 },
    ],
  },
  {
    category: "digital storage",
    useCase: "media export budgets, storage planning, and upload constraints",
    notes: "Some systems use decimal (1000) while others use binary (1024) scaling.",
    units: [
      { label: "KB", slug: "kb", toBase: 1 },
      { label: "MB", slug: "mb", toBase: 1024 },
      { label: "GB", slug: "gb", toBase: 1024 * 1024 },
      { label: "TB", slug: "tb", toBase: 1024 * 1024 * 1024 },
      { label: "bytes", slug: "bytes", toBase: 1 / 1024 },
      { label: "bits", slug: "bits", toBase: 1 / (1024 * 8) },
    ],
  },
  {
    category: "time",
    useCase: "project tracking, scheduling, and workload planning",
    notes: "Time conversions are simple multipliers but rounding changes interpretation.",
    units: [
      { label: "seconds", slug: "sec", toBase: 1 },
      { label: "minutes", slug: "min", toBase: 60 },
      { label: "hours", slug: "hour", toBase: 3600 },
      { label: "days", slug: "day", toBase: 86400 },
      { label: "weeks", slug: "week", toBase: 604800 },
    ],
  },
];

function buildUnitEntities(): UnitConvertEntity[] {
  const entities: UnitConvertEntity[] = [];
  let priority = 1;

  for (const family of unitFamilies) {
    for (const source of family.units) {
      for (const target of family.units) {
        if (source.slug === target.slug) continue;

        const formula =
          family.category === "temperature"
            ? temperatureFormula(source.label, target.label)
            : buildLinearFormula(source, target);

        entities.push({
          key: `${source.slug}-to-${target.slug}`,
          name: `${source.label} to ${target.label}`,
          sourceUnit: source.label,
          targetUnit: target.label,
          category: family.category,
          formula,
          toolSlug: "all",
          bestFor: `Quick ${family.category} conversions for ${family.useCase}.`,
          notes: `${family.notes} Verify assumptions before final reporting.`,
          priority,
        });
        priority += 1;
      }
    }
  }

  return entities;
}

export const unitConvertTemplates: UnitConvertTemplate[] = [
  {
    slug: "unit-convert-main",
    phrase: "{sourceUnit} to {targetUnit}",
    phraseSlug: "convert",
    titlePattern: "{sourceUnit} to {targetUnit} Conversion | Formula + Calculator",
    descriptionPattern:
      "Convert {sourceUnit} to {targetUnit} with the exact formula, reference factors, and a fast calculator workflow.",
    introPattern:
      "This {sourceUnit} to {targetUnit} conversion page gives the practical formula, unit relationship, and a repeatable workflow for accurate estimates.",
  },
  {
    slug: "unit-convert-converter",
    phrase: "{sourceUnit} to {targetUnit} converter",
    phraseSlug: "converter",
    titlePattern: "{sourceUnit} to {targetUnit} Converter (Free Online)",
    descriptionPattern:
      "Need a {sourceUnit} to {targetUnit} converter? Use this quick reference for conversion accuracy and repeatable checks.",
    introPattern:
      "Use this {sourceUnit} to {targetUnit} converter guide when you need consistent results for planning, reporting, and day-to-day calculations.",
  },
  {
    slug: "unit-convert-how-to",
    phrase: "how to convert {sourceUnit} to {targetUnit}",
    phraseSlug: "how-to",
    titlePattern: "How to Convert {sourceUnit} to {targetUnit} (Step-by-Step)",
    descriptionPattern:
      "Learn how to convert {sourceUnit} to {targetUnit} with a straightforward formula method and practical usage notes.",
    introPattern:
      "If you are figuring out how to convert {sourceUnit} to {targetUnit}, begin with the core formula below, then validate values with a calculator workflow.",
  },
  {
    slug: "unit-convert-formula",
    phrase: "{sourceUnit} to {targetUnit} formula",
    phraseSlug: "formula",
    titlePattern: "{sourceUnit} to {targetUnit} Formula + Worked Conversion Method",
    descriptionPattern:
      "Find the {sourceUnit} to {targetUnit} conversion formula and use it with practical examples for clean, repeatable outputs.",
    introPattern:
      "This guide highlights the {sourceUnit} to {targetUnit} formula so you can convert values manually and cross-check results in a calculator.",
  },
  {
    slug: "unit-convert-chart",
    phrase: "{sourceUnit} to {targetUnit} conversion chart",
    phraseSlug: "chart",
    titlePattern: "{sourceUnit} to {targetUnit} Conversion Chart Guide",
    descriptionPattern:
      "Use this {sourceUnit} to {targetUnit} conversion chart guide to understand unit relationships, formulas, and quick-check workflows.",
    introPattern:
      "For fast lookups, this {sourceUnit} to {targetUnit} conversion chart guide summarizes the unit relationship and the exact formula to apply.",
  },
];

export const unitConvertEntities: UnitConvertEntity[] = buildUnitEntities();
