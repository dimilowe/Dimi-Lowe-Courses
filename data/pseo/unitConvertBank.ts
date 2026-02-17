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

export const unitConvertTemplates: UnitConvertTemplate[] = [
  {
    slug: "unit-convert-main",
    phrase: "{sourceUnit} to {targetUnit}",
    phraseSlug: "convert",
    titlePattern: "{sourceUnit} to {targetUnit} Conversion | Formula + Quick Tool Path",
    descriptionPattern:
      "Convert {sourceUnit} to {targetUnit} with the exact formula, practical examples, and a fast calculator workflow.",
    introPattern:
      "This {sourceUnit} to {targetUnit} conversion page gives you the core formula, when to use it, and the fastest path for everyday calculations.",
  },
  {
    slug: "unit-convert-converter",
    phrase: "{sourceUnit} to {targetUnit} converter",
    phraseSlug: "converter",
    titlePattern: "{sourceUnit} to {targetUnit} Converter (Free Online Conversion Guide)",
    descriptionPattern:
      "Need a {sourceUnit} to {targetUnit} converter? Use this quick reference for formula accuracy and repeatable calculation workflows.",
    introPattern:
      "Use this {sourceUnit} to {targetUnit} converter guide when you need repeatable results for planning, budgeting, reporting, or classroom work.",
  },
  {
    slug: "unit-convert-how-to",
    phrase: "how to convert {sourceUnit} to {targetUnit}",
    phraseSlug: "how-to",
    titlePattern: "How to Convert {sourceUnit} to {targetUnit} (Step-by-Step)",
    descriptionPattern:
      "Learn how to convert {sourceUnit} to {targetUnit} with a simple formula walkthrough and practical usage notes.",
    introPattern:
      "If you are figuring out how to convert {sourceUnit} to {targetUnit}, start with the baseline formula below, then validate with a calculator workflow for final checks.",
  },
];

export const unitConvertEntities: UnitConvertEntity[] = [
  {
    key: "cm-to-inches",
    name: "Centimeters to Inches",
    sourceUnit: "cm",
    targetUnit: "inches",
    category: "length",
    formula: "inches = cm / 2.54",
    toolSlug: "all",
    bestFor: "Design mockups, product dimensions, and print sizing.",
    notes: "Keep at least two decimal places for layout-sensitive work.",
    priority: 1,
  },
  {
    key: "inches-to-cm",
    name: "Inches to Centimeters",
    sourceUnit: "inches",
    targetUnit: "cm",
    category: "length",
    formula: "cm = inches * 2.54",
    toolSlug: "all",
    bestFor: "Converting imperial dimensions to metric specs.",
    notes: "Useful for manufacturing and cross-region product listings.",
    priority: 2,
  },
  {
    key: "kg-to-lbs",
    name: "Kilograms to Pounds",
    sourceUnit: "kg",
    targetUnit: "lbs",
    category: "weight",
    formula: "lbs = kg * 2.20462",
    toolSlug: "all",
    bestFor: "Fitness tracking and shipping estimates.",
    notes: "Round based on context: 0.1 for bodyweight, 0.01 for logistics.",
    priority: 3,
  },
  {
    key: "lbs-to-kg",
    name: "Pounds to Kilograms",
    sourceUnit: "lbs",
    targetUnit: "kg",
    category: "weight",
    formula: "kg = lbs / 2.20462",
    toolSlug: "all",
    bestFor: "International fitness plans and clinical references.",
    notes: "Use consistent rounding in progress reports.",
    priority: 4,
  },
  {
    key: "miles-to-km",
    name: "Miles to Kilometers",
    sourceUnit: "miles",
    targetUnit: "km",
    category: "distance",
    formula: "km = miles * 1.60934",
    toolSlug: "all",
    bestFor: "Travel planning and race pacing conversions.",
    notes: "Include pace conversions when comparing training logs.",
    priority: 5,
  },
  {
    key: "km-to-miles",
    name: "Kilometers to Miles",
    sourceUnit: "km",
    targetUnit: "miles",
    category: "distance",
    formula: "miles = km / 1.60934",
    toolSlug: "all",
    bestFor: "Cross-region route planning and fitness goals.",
    notes: "Useful for converting 5K/10K distances for US audiences.",
    priority: 6,
  },
  {
    key: "c-to-f",
    name: "Celsius to Fahrenheit",
    sourceUnit: "Celsius",
    targetUnit: "Fahrenheit",
    category: "temperature",
    formula: "F = (C * 9/5) + 32",
    toolSlug: "all",
    bestFor: "Weather translation and cooking references.",
    notes: "For cooking, keep one decimal place for consistent recipes.",
    priority: 7,
  },
  {
    key: "f-to-c",
    name: "Fahrenheit to Celsius",
    sourceUnit: "Fahrenheit",
    targetUnit: "Celsius",
    category: "temperature",
    formula: "C = (F - 32) * 5/9",
    toolSlug: "all",
    bestFor: "International recipes and lab reference values.",
    notes: "Round at the final step to avoid compounded error.",
    priority: 8,
  },
  {
    key: "liters-to-gallons",
    name: "Liters to Gallons",
    sourceUnit: "liters",
    targetUnit: "gallons",
    category: "volume",
    formula: "gallons = liters / 3.78541",
    toolSlug: "all",
    bestFor: "Fuel economy and fluid volume comparisons.",
    notes: "Assumes US liquid gallons.",
    priority: 9,
  },
  {
    key: "gallons-to-liters",
    name: "Gallons to Liters",
    sourceUnit: "gallons",
    targetUnit: "liters",
    category: "volume",
    formula: "liters = gallons * 3.78541",
    toolSlug: "all",
    bestFor: "Vehicle, tank, and batch-mix calculations.",
    notes: "Use imperial gallon conversion only when explicitly required.",
    priority: 10,
  },
  {
    key: "mb-to-gb",
    name: "MB to GB",
    sourceUnit: "MB",
    targetUnit: "GB",
    category: "digital storage",
    formula: "GB = MB / 1024",
    toolSlug: "all",
    bestFor: "Storage planning and media export sizing.",
    notes: "Binary conversion shown; decimal GB may differ by platform.",
    priority: 11,
  },
  {
    key: "gb-to-mb",
    name: "GB to MB",
    sourceUnit: "GB",
    targetUnit: "MB",
    category: "digital storage",
    formula: "MB = GB * 1024",
    toolSlug: "all",
    bestFor: "Estimating upload limits and file budget targets.",
    notes: "Confirm whether your platform uses 1000 or 1024 scaling.",
    priority: 12,
  },
  {
    key: "sqft-to-sqm",
    name: "Square Feet to Square Meters",
    sourceUnit: "sq ft",
    targetUnit: "sq m",
    category: "area",
    formula: "sq m = sq ft / 10.7639",
    toolSlug: "all",
    bestFor: "Real estate and space-planning comparisons.",
    notes: "Use two decimals for listings and quotes.",
    priority: 13,
  },
  {
    key: "sqm-to-sqft",
    name: "Square Meters to Square Feet",
    sourceUnit: "sq m",
    targetUnit: "sq ft",
    category: "area",
    formula: "sq ft = sq m * 10.7639",
    toolSlug: "all",
    bestFor: "Converting metric floor plans to US-style references.",
    notes: "Preserve raw values in internal docs before rounding.",
    priority: 14,
  },
  {
    key: "oz-to-grams",
    name: "Ounces to Grams",
    sourceUnit: "oz",
    targetUnit: "grams",
    category: "weight",
    formula: "grams = oz * 28.3495",
    toolSlug: "all",
    bestFor: "Food prep, packaging, and recipe conversions.",
    notes: "Kitchen use usually rounds to whole grams.",
    priority: 15,
  },
  {
    key: "grams-to-oz",
    name: "Grams to Ounces",
    sourceUnit: "grams",
    targetUnit: "oz",
    category: "weight",
    formula: "oz = grams / 28.3495",
    toolSlug: "all",
    bestFor: "Translating metric labels for US nutrition references.",
    notes: "Use at least one decimal place for packaging accuracy.",
    priority: 16,
  },
  {
    key: "minutes-to-hours",
    name: "Minutes to Hours",
    sourceUnit: "minutes",
    targetUnit: "hours",
    category: "time",
    formula: "hours = minutes / 60",
    toolSlug: "all",
    bestFor: "Scheduling and project-time rollups.",
    notes: "Two decimals usually balances precision and readability.",
    priority: 17,
  },
  {
    key: "hours-to-minutes",
    name: "Hours to Minutes",
    sourceUnit: "hours",
    targetUnit: "minutes",
    category: "time",
    formula: "minutes = hours * 60",
    toolSlug: "all",
    bestFor: "Task breakdowns and production planning.",
    notes: "Useful for converting decimal-hour logs to exact minutes.",
    priority: 18,
  },
];
