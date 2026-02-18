export const CALCULATOR_INTENT_BANK_SLUG = "calculator-intent";
export const CALCULATOR_INTENT_BANK_HUB_PATH = "/tools/calculator-bank";

export type CalculatorIntentTemplate = {
  slug: string;
  phrase: string;
  phraseSlug: string;
  titlePattern: string;
  descriptionPattern: string;
  introPattern: string;
};

export type CalculatorIntentEntity = {
  key: string;
  intent: string;
  topic: string;
  audience: string;
  primaryInput: string;
  primaryOutput: string;
  formulaHint: string;
  toolSlug: string;
  bestFor: string;
  notes: string;
  priority: number;
};

type CalculatorIntentSeed = Omit<CalculatorIntentEntity, "key" | "intent" | "priority"> & {
  baseKey: string;
  baseIntent: string;
};

type IntentVariant = {
  slugSuffix: string;
  transformIntent: (baseIntent: string) => string;
};

const intentVariants: IntentVariant[] = [
  {
    slugSuffix: "base",
    transformIntent: (baseIntent) => baseIntent,
  },
  {
    slugSuffix: "estimate",
    transformIntent: (baseIntent) => `${baseIntent} estimate`,
  },
  {
    slugSuffix: "planning",
    transformIntent: (baseIntent) => `${baseIntent} planning`,
  },
  {
    slugSuffix: "formula",
    transformIntent: (baseIntent) => `${baseIntent} formula`,
  },
  {
    slugSuffix: "goal",
    transformIntent: (baseIntent) => `${baseIntent} goal`,
  },
];

const calculatorIntentSeeds: CalculatorIntentSeed[] = [
  {
    baseKey: "calorie-deficit",
    baseIntent: "calorie deficit",
    topic: "nutrition",
    audience: "fat loss planning",
    primaryInput: "age, sex, height, weight, activity level",
    primaryOutput: "daily calorie target",
    formulaHint: "target calories = maintenance calories - desired deficit",
    toolSlug: "calorie-deficit-calculator",
    bestFor: "Planning sustainable weekly fat-loss targets.",
    notes: "Recalculate every 2-4 weeks as body weight changes.",
  },
  {
    baseKey: "maintenance-calories",
    baseIntent: "maintenance calories",
    topic: "nutrition",
    audience: "weight maintenance",
    primaryInput: "age, sex, weight, height, activity level",
    primaryOutput: "estimated TDEE",
    formulaHint: "maintenance calories = BMR x activity factor",
    toolSlug: "calorie-counter-maintenance",
    bestFor: "Finding a baseline before cutting or bulking.",
    notes: "Track actual weight trend to calibrate estimate.",
  },
  {
    baseKey: "bmi",
    baseIntent: "BMI",
    topic: "health metrics",
    audience: "general health check",
    primaryInput: "height and weight",
    primaryOutput: "BMI score range",
    formulaHint: "BMI = weight(kg) / height(m)^2",
    toolSlug: "calorie-counter-bmi",
    bestFor: "Simple bodyweight trend context.",
    notes: "Use alongside waist and body-composition context.",
  },
  {
    baseKey: "steps-to-calories",
    baseIntent: "steps to calories",
    topic: "activity estimation",
    audience: "walking-based tracking",
    primaryInput: "step count, body weight, pace assumptions",
    primaryOutput: "estimated calories burned",
    formulaHint: "calories = steps x stride distance x energy cost",
    toolSlug: "calorie-counter-steps",
    bestFor: "Daily movement goals and habit tracking.",
    notes: "Stride length and pace assumptions affect accuracy.",
  },
  {
    baseKey: "walking-calories",
    baseIntent: "walking calories burned",
    topic: "activity estimation",
    audience: "walking workouts",
    primaryInput: "body weight, duration, speed, incline",
    primaryOutput: "calories burned estimate",
    formulaHint: "calories = MET x bodyweight(kg) x duration(hours)",
    toolSlug: "calorie-counter-walking",
    bestFor: "Comparing walk sessions by duration and pace.",
    notes: "Outdoor terrain and wind can change real burn.",
  },
  {
    baseKey: "treadmill-calories",
    baseIntent: "treadmill calories burned",
    topic: "activity estimation",
    audience: "gym cardio sessions",
    primaryInput: "body weight, speed, incline, duration",
    primaryOutput: "estimated calories burned",
    formulaHint: "calories = treadmill MET estimate x duration",
    toolSlug: "calorie-counter-treadmill",
    bestFor: "Comparing treadmill workouts objectively.",
    notes: "Heart-rate and effort can differ from machine estimates.",
  },
  {
    baseKey: "body-fat",
    baseIntent: "body fat percentage",
    topic: "health metrics",
    audience: "fitness assessment",
    primaryInput: "height, neck/waist/hip measures, sex",
    primaryOutput: "estimated body-fat percentage",
    formulaHint: "body-fat estimates use anthropometric equations and assumptions",
    toolSlug: "calorie-counter-bmi",
    bestFor: "Adding body-composition context to weight trends.",
    notes: "Measurement consistency matters more than single readings.",
  },
  {
    baseKey: "protein-intake",
    baseIntent: "protein intake",
    topic: "nutrition",
    audience: "diet planning",
    primaryInput: "body weight, activity level, training goal",
    primaryOutput: "daily protein target",
    formulaHint: "target protein is often set per kg or lb bodyweight",
    toolSlug: "calorie-deficit-calculator",
    bestFor: "Structuring meal targets around training goals.",
    notes: "Adjust by satiety and recovery outcomes.",
  },
  {
    baseKey: "macro-split",
    baseIntent: "macro split",
    topic: "nutrition",
    audience: "meal planning",
    primaryInput: "daily calories and macro percentage targets",
    primaryOutput: "grams of protein, carbs, and fat",
    formulaHint: "macro grams = calorie allocation / calories per gram",
    toolSlug: "calorie-deficit-calculator",
    bestFor: "Turning calorie goals into meal-ready macro targets.",
    notes: "Consistency is more important than perfect ratios.",
  },
  {
    baseKey: "water-intake",
    baseIntent: "water intake",
    topic: "nutrition",
    audience: "hydration planning",
    primaryInput: "body weight, activity, climate assumptions",
    primaryOutput: "daily hydration target",
    formulaHint: "hydration target scales with weight and activity load",
    toolSlug: "calorie-counter-maintenance",
    bestFor: "Setting realistic hydration baselines.",
    notes: "Electrolyte needs increase with heavy sweat loss.",
  },
  {
    baseKey: "home-loan-payment",
    baseIntent: "home loan payment",
    topic: "finance",
    audience: "home buyers",
    primaryInput: "loan amount, APR, term, taxes, insurance",
    primaryOutput: "monthly payment estimate",
    formulaHint: "payment uses amortization on principal, rate, and term",
    toolSlug: "loan-estimator-home",
    bestFor: "Budgeting affordability before lender pre-approval.",
    notes: "Add PMI and HOA where relevant.",
  },
  {
    baseKey: "mortgage-estimate",
    baseIntent: "mortgage estimate",
    topic: "finance",
    audience: "property planning",
    primaryInput: "home price, down payment, interest rate, term",
    primaryOutput: "principal and interest monthly estimate",
    formulaHint: "monthly mortgage uses principal, monthly rate, and number of payments",
    toolSlug: "loan-estimator-home",
    bestFor: "Comparing financing scenarios quickly.",
    notes: "Rate lock timing materially impacts payment.",
  },
  {
    baseKey: "loan-affordability",
    baseIntent: "loan affordability",
    topic: "finance",
    audience: "borrower planning",
    primaryInput: "income, debts, rate, term",
    primaryOutput: "estimated affordable loan amount",
    formulaHint: "affordability blends payment ratio and debt constraints",
    toolSlug: "loan-estimator-home",
    bestFor: "Setting a realistic pre-search budget.",
    notes: "Lender-specific DTI rules vary.",
  },
  {
    baseKey: "monthly-mortgage-allin",
    baseIntent: "monthly mortgage with taxes and insurance",
    topic: "finance",
    audience: "home purchase budgeting",
    primaryInput: "principal, rate, term, taxes, insurance",
    primaryOutput: "all-in monthly housing payment",
    formulaHint: "all-in payment = principal and interest + taxes + insurance (+ PMI)",
    toolSlug: "loan-estimator-home",
    bestFor: "True monthly budget planning.",
    notes: "Escrow setup can alter initial payment amounts.",
  },
  {
    baseKey: "debt-payoff",
    baseIntent: "debt payoff",
    topic: "finance",
    audience: "personal finance planning",
    primaryInput: "balance, interest rate, payment amount",
    primaryOutput: "payoff timeline and interest cost",
    formulaHint: "timeline depends on payment size versus accrued interest",
    toolSlug: "loan-estimator-home",
    bestFor: "Choosing between snowball and avalanche strategies.",
    notes: "Missed payments materially extend payoff horizon.",
  },
  {
    baseKey: "budget-allocation",
    baseIntent: "monthly budget allocation",
    topic: "finance",
    audience: "household planning",
    primaryInput: "income and category percentages",
    primaryOutput: "target spending per category",
    formulaHint: "category budget = income x allocation percentage",
    toolSlug: "p-and-l-report",
    bestFor: "Converting budgeting rules into monthly caps.",
    notes: "Audit subscriptions and variable expenses monthly.",
  },
  {
    baseKey: "emergency-fund",
    baseIntent: "emergency fund size",
    topic: "finance",
    audience: "risk planning",
    primaryInput: "monthly expenses and coverage months target",
    primaryOutput: "target emergency fund value",
    formulaHint: "fund target = monthly essential spend x months covered",
    toolSlug: "p-and-l-report",
    bestFor: "Sizing savings buffers against income shocks.",
    notes: "Variable income usually needs larger buffers.",
  },
  {
    baseKey: "retirement-savings",
    baseIntent: "401k retirement savings",
    topic: "retirement",
    audience: "long-term planning",
    primaryInput: "current balance, contribution, match, return rate",
    primaryOutput: "projected retirement balance",
    formulaHint: "future value uses recurring contributions and compound growth",
    toolSlug: "401k-retirement-calculator",
    bestFor: "Testing contribution-rate scenarios over decades.",
    notes: "Review assumptions annually.",
  },
  {
    baseKey: "retirement-income-gap",
    baseIntent: "retirement income gap",
    topic: "retirement",
    audience: "financial planning",
    primaryInput: "expected expenses, projected income, inflation",
    primaryOutput: "estimated monthly or annual gap",
    formulaHint: "gap = projected expenses - projected retirement income",
    toolSlug: "401k-retirement-calculator",
    bestFor: "Sizing contribution increases before retirement.",
    notes: "Include healthcare and tax assumptions.",
  },
  {
    baseKey: "retirement-withdrawal",
    baseIntent: "retirement withdrawal rate",
    topic: "retirement",
    audience: "portfolio sustainability planning",
    primaryInput: "portfolio size, annual spend, return assumptions",
    primaryOutput: "withdrawal percentage and longevity estimate",
    formulaHint: "withdrawal rate = annual withdrawals / portfolio value",
    toolSlug: "401k-retirement-calculator",
    bestFor: "Checking whether spending aligns with portfolio size.",
    notes: "Sequence-of-returns risk matters in early retirement years.",
  },
  {
    baseKey: "shipping-cost",
    baseIntent: "shipping cost",
    topic: "logistics",
    audience: "ecommerce sellers",
    primaryInput: "package weight, dimensions, zone, service level",
    primaryOutput: "estimated shipping price",
    formulaHint: "rate is driven by billed weight, zone, and carrier service",
    toolSlug: "ups-shipping-cost",
    bestFor: "Pre-checking fulfillment margins.",
    notes: "Dimensional weight can exceed scale weight.",
  },
  {
    baseKey: "ups-rate",
    baseIntent: "UPS shipping price",
    topic: "logistics",
    audience: "shipment planning",
    primaryInput: "origin/destination, package specs, service speed",
    primaryOutput: "UPS rate estimate",
    formulaHint: "carrier price combines zone, weight class, and surcharges",
    toolSlug: "ups-shipping-cost",
    bestFor: "Choosing cost-effective service tiers.",
    notes: "Fuel and residential surcharges may apply.",
  },
  {
    baseKey: "dim-weight",
    baseIntent: "dimensional weight",
    topic: "logistics",
    audience: "shipping operations",
    primaryInput: "package length, width, height, divisor",
    primaryOutput: "billable dimensional weight",
    formulaHint: "dimensional weight = (L x W x H) / divisor",
    toolSlug: "ups-shipping-cost",
    bestFor: "Preventing underpriced shipping labels.",
    notes: "Carrier divisors vary by contract and service.",
  },
  {
    baseKey: "delivery-cost-per-order",
    baseIntent: "delivery cost per order",
    topic: "logistics",
    audience: "unit economics tracking",
    primaryInput: "shipping spend and order count",
    primaryOutput: "average shipping cost per order",
    formulaHint: "cost per order = total shipping spend / total orders",
    toolSlug: "ups-shipping-cost",
    bestFor: "Monitoring fulfillment efficiency over time.",
    notes: "Segment by destination zone for better visibility.",
  },
  {
    baseKey: "car-repair-estimate",
    baseIntent: "car repair estimate",
    topic: "automotive",
    audience: "vehicle owners",
    primaryInput: "repair type, vehicle info, labor assumptions, parts",
    primaryOutput: "estimated repair cost range",
    formulaHint: "estimate = parts + (labor hours x labor rate) + fees",
    toolSlug: "estimator-for-car-repair",
    bestFor: "Budgeting before mechanic quotes.",
    notes: "Regional labor rates vary significantly.",
  },
  {
    baseKey: "maintenance-cost",
    baseIntent: "auto maintenance cost",
    topic: "automotive",
    audience: "ownership budgeting",
    primaryInput: "service interval, labor, parts, mileage",
    primaryOutput: "annual maintenance estimate",
    formulaHint: "annual estimate sums planned services over mileage cycle",
    toolSlug: "estimator-for-car-repair",
    bestFor: "Comparing maintenance burden across vehicles.",
    notes: "Unexpected repairs are not fully captured.",
  },
  {
    baseKey: "fuel-cost",
    baseIntent: "fuel cost per month",
    topic: "automotive",
    audience: "transport budgeting",
    primaryInput: "monthly miles, MPG, gas price",
    primaryOutput: "estimated monthly fuel spend",
    formulaHint: "fuel spend = (distance / MPG) x fuel price",
    toolSlug: "estimator-for-car-repair",
    bestFor: "Planning travel and commute costs.",
    notes: "Driving style and traffic conditions change real MPG.",
  },
  {
    baseKey: "profit-loss",
    baseIntent: "profit and loss",
    topic: "business finance",
    audience: "small business operators",
    primaryInput: "revenue lines and expense lines",
    primaryOutput: "net profit or loss",
    formulaHint: "net profit = total revenue - total expenses",
    toolSlug: "p-and-l-report",
    bestFor: "Monthly business health snapshots.",
    notes: "Separate fixed and variable costs for cleaner analysis.",
  },
  {
    baseKey: "gross-margin",
    baseIntent: "gross profit margin",
    topic: "business finance",
    audience: "operators and founders",
    primaryInput: "revenue and cost of goods sold",
    primaryOutput: "gross margin percentage",
    formulaHint: "gross margin = (revenue - COGS) / revenue x 100",
    toolSlug: "p-and-l-report",
    bestFor: "Tracking pricing and COGS efficiency.",
    notes: "Compare by product line for better insight.",
  },
  {
    baseKey: "net-margin",
    baseIntent: "net profit margin",
    topic: "business finance",
    audience: "business performance tracking",
    primaryInput: "net income and total revenue",
    primaryOutput: "net margin percentage",
    formulaHint: "net margin = net income / revenue x 100",
    toolSlug: "p-and-l-report",
    bestFor: "Monitoring profitability trends over time.",
    notes: "One-time charges can distort period margins.",
  },
  {
    baseKey: "operating-margin",
    baseIntent: "operating margin",
    topic: "business finance",
    audience: "owner-operator analysis",
    primaryInput: "operating income and net sales",
    primaryOutput: "operating margin percentage",
    formulaHint: "operating margin = operating income / net sales x 100",
    toolSlug: "p-and-l-report",
    bestFor: "Tracking operational efficiency across periods.",
    notes: "Compare against industry benchmarks.",
  },
  {
    baseKey: "break-even",
    baseIntent: "break-even point",
    topic: "business finance",
    audience: "pricing and planning",
    primaryInput: "fixed costs, variable cost per unit, price per unit",
    primaryOutput: "units required to break even",
    formulaHint: "break-even units = fixed costs / (price - variable cost)",
    toolSlug: "p-and-l-report",
    bestFor: "Setting realistic sales targets.",
    notes: "Run sensitivity analysis on price and cost shifts.",
  },
  {
    baseKey: "markup",
    baseIntent: "markup percentage",
    topic: "business finance",
    audience: "pricing strategy",
    primaryInput: "cost and selling price",
    primaryOutput: "markup percentage",
    formulaHint: "markup = (price - cost) / cost x 100",
    toolSlug: "p-and-l-report",
    bestFor: "Checking pricing structure by SKU.",
    notes: "Do not confuse markup with margin.",
  },
  {
    baseKey: "discount-impact",
    baseIntent: "discount impact on profit",
    topic: "business finance",
    audience: "promotion planning",
    primaryInput: "list price, discount rate, unit cost",
    primaryOutput: "post-discount margin impact",
    formulaHint: "new margin compares discounted revenue against unchanged cost",
    toolSlug: "p-and-l-report",
    bestFor: "Stress-testing promotions before launch.",
    notes: "Include conversion-lift assumptions separately.",
  },
  {
    baseKey: "startup-runway",
    baseIntent: "startup runway",
    topic: "business finance",
    audience: "founder cash planning",
    primaryInput: "cash on hand and monthly burn",
    primaryOutput: "months of runway",
    formulaHint: "runway months = cash balance / net monthly burn",
    toolSlug: "p-and-l-report",
    bestFor: "Planning fundraising timelines and hiring pace.",
    notes: "Model best-case and downside burn scenarios.",
  },
  {
    baseKey: "cac",
    baseIntent: "customer acquisition cost",
    topic: "growth metrics",
    audience: "marketing performance",
    primaryInput: "marketing spend and acquired customers",
    primaryOutput: "cost per acquired customer",
    formulaHint: "CAC = acquisition spend / new customers",
    toolSlug: "p-and-l-report",
    bestFor: "Evaluating paid channel efficiency.",
    notes: "Use cohort windows to avoid timing distortions.",
  },
  {
    baseKey: "ltv",
    baseIntent: "customer lifetime value",
    topic: "growth metrics",
    audience: "retention and monetization planning",
    primaryInput: "average revenue, gross margin, retention assumptions",
    primaryOutput: "estimated LTV",
    formulaHint: "LTV combines margin-adjusted revenue over customer lifespan",
    toolSlug: "p-and-l-report",
    bestFor: "Setting sane CAC payback constraints.",
    notes: "Review LTV by customer segment.",
  },
  {
    baseKey: "cac-to-ltv",
    baseIntent: "CAC to LTV ratio",
    topic: "growth metrics",
    audience: "unit economics planning",
    primaryInput: "CAC and LTV estimates",
    primaryOutput: "LTV:CAC ratio",
    formulaHint: "LTV:CAC = lifetime value / acquisition cost",
    toolSlug: "p-and-l-report",
    bestFor: "Checking growth efficiency thresholds.",
    notes: "Ratio quality depends on LTV estimate quality.",
  },
];

function buildCalculatorIntentEntities(): CalculatorIntentEntity[] {
  const entities: CalculatorIntentEntity[] = [];
  let priority = 1;

  for (const seed of calculatorIntentSeeds) {
    for (const variant of intentVariants) {
      const intent = variant.transformIntent(seed.baseIntent).trim();
      entities.push({
        key: variant.slugSuffix === "base" ? seed.baseKey : `${seed.baseKey}-${variant.slugSuffix}`,
        intent,
        topic: seed.topic,
        audience: seed.audience,
        primaryInput: seed.primaryInput,
        primaryOutput: seed.primaryOutput,
        formulaHint: seed.formulaHint,
        toolSlug: seed.toolSlug,
        bestFor: seed.bestFor,
        notes: seed.notes,
        priority,
      });
      priority += 1;
    }
  }

  return entities;
}

export const calculatorIntentTemplates: CalculatorIntentTemplate[] = [
  {
    slug: "calculator-intent-main",
    phrase: "{intent} calculator",
    phraseSlug: "calculator",
    titlePattern: "{intent} Calculator (Free) | Formula, Inputs, and Workflow",
    descriptionPattern:
      "Use this {intent} calculator guide to understand key inputs, expected outputs, and a practical free workflow.",
    introPattern:
      "This {intent} calculator page explains the core inputs, expected outputs, and a practical process so you can estimate results faster and with fewer errors.",
  },
  {
    slug: "calculator-intent-free",
    phrase: "free {intent} calculator",
    phraseSlug: "free",
    titlePattern: "Free {intent} Calculator | Step-by-Step Input Guide",
    descriptionPattern:
      "Need a free {intent} calculator? Follow this quick-reference method to run cleaner estimates with the right assumptions.",
    introPattern:
      "A free {intent} calculator works best when variables are defined up front. Use the guidance below to improve estimate consistency and decision quality.",
  },
  {
    slug: "calculator-intent-how-to",
    phrase: "how to calculate {intent}",
    phraseSlug: "how-to",
    titlePattern: "How to Calculate {intent} (Formula and Practical Steps)",
    descriptionPattern:
      "Learn how to calculate {intent} with formula context, variable definitions, and direct calculator workflow guidance.",
    introPattern:
      "If you are figuring out how to calculate {intent}, start with variable definitions, then run scenario checks to validate assumptions before acting on results.",
  },
  {
    slug: "calculator-intent-online",
    phrase: "{intent} calculator online",
    phraseSlug: "online",
    titlePattern: "{intent} Calculator Online (Fast, Free Workflow)",
    descriptionPattern:
      "Use this {intent} calculator online guide to get fast estimates with clear input requirements and output interpretation.",
    introPattern:
      "This {intent} calculator online workflow helps you move from raw inputs to practical estimates quickly while preserving clarity around assumptions.",
  },
  {
    slug: "calculator-intent-best",
    phrase: "best {intent} calculator",
    phraseSlug: "best",
    titlePattern: "Best {intent} Calculator Approach (Free Guide)",
    descriptionPattern:
      "Compare the best {intent} calculator approach for speed, clarity, and repeatable estimate quality.",
    introPattern:
      "The best {intent} calculator workflow is one that makes assumptions explicit and easy to audit; use this page as a structured checklist.",
  },
];

export const calculatorIntentEntities: CalculatorIntentEntity[] = buildCalculatorIntentEntities();
