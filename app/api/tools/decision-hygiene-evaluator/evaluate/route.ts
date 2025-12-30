import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { evaluate, DecisionHygieneInput } from '@/lib/decisionHygiene';

const WHO_PAYS = [
  'Individual consumer',
  'Small business',
  'Mid-size business',
  'Enterprise',
  'Advertisers'
] as const;

const EXPECTED_PRICE = [
  '<$10',
  '$10–$50',
  '$50–$200',
  '$200–$1,000',
  '$1,000+'
] as const;

const PAYING_USERS_REQUIRED = [
  '<100',
  '100–1,000',
  '1,000–10,000',
  '10,000+'
] as const;

const BEHAVIOR_CHANGE = [
  'No behavior change',
  'Small behavior change',
  'Major behavior change'
] as const;

const SUCCESS_DEPENDENCY = [
  'None',
  'Virality',
  'Platform featuring / algorithm boost',
  'Press / influencer lift',
  'Regulatory approval',
  'Future unbuilt feature'
] as const;

const ACQUISITION_CHANNEL = [
  'SEO',
  'YouTube',
  'Social short-form',
  'Paid ads',
  'Cold outreach',
  'Partnerships',
  'App store / marketplace'
] as const;

const CHANNEL_CONTROL = [
  'Proven audience',
  'Small but real audience',
  'No existing audience'
] as const;

const ATTENTION_ADVANTAGE = [
  'Clear differentiated wedge',
  'Moderate improvement',
  'Minimal differentiation'
] as const;

const TESTABLE_ASSUMPTION = [
  'Yes — cheaply and quickly',
  'Yes — but with meaningful effort',
  'No — commitment comes first'
] as const;

const TIME_TO_SIGNAL = [
  '<7 days',
  '7–30 days',
  '1–3 months',
  '3+ months'
] as const;

const COST_BEFORE_SIGNAL = [
  '<$100 or <10 hours',
  '$100–$1k or 10–50 hours',
  '$1k–$10k or 50–200 hours',
  '$10k+ or 200+ hours'
] as const;

const ATTEMPTS_PER_MONTH = [
  '10+',
  '3–9',
  '1–2',
  '<1'
] as const;

const DIAGNOSE_FAILURE = [
  'Yes',
  'Partially',
  'No'
] as const;

const REVERSIBILITY = [
  'Fully reversible',
  'Mostly reversible',
  'Hard to reverse',
  'Irreversible'
] as const;

const COMMITMENT_REQUIRED = [
  'None',
  'Significant capital',
  'Hiring',
  'Public brand identity',
  'Long-term contracts',
  'Custom infrastructure'
] as const;

const DOWNSIDE_IF_FAILS = [
  'Minor time loss',
  'Moderate time/money loss',
  'Severe financial loss',
  'Reputation damage'
] as const;

const PRIMARY_REASON = [
  'Clear market signal',
  'Existing unfair advantage',
  'Curiosity / interest',
  'Emotional attachment'
] as const;

const inputSchema = z.object({
  q1_idea: z.string().min(1, 'Idea is required').max(200, 'Idea must be 200 characters or less'),
  q2_who_pays: z.enum(WHO_PAYS, { message: 'Who pays is required' }),
  q3_expected_price: z.enum(EXPECTED_PRICE, { message: 'Expected price is required' }),
  q4_paying_users_required: z.enum(PAYING_USERS_REQUIRED, { message: 'Paying users required is required' }),
  q5_behavior_change: z.enum(BEHAVIOR_CHANGE, { message: 'Behavior change is required' }),
  q6_success_depends_on: z.array(z.enum(SUCCESS_DEPENDENCY)).min(1, 'At least one selection required'),
  q7_first_channel: z.enum(ACQUISITION_CHANNEL, { message: 'First channel is required' }),
  q8_channel_control: z.enum(CHANNEL_CONTROL, { message: 'Channel control is required' }),
  q9_attention_advantage: z.enum(ATTENTION_ADVANTAGE, { message: 'Attention advantage is required' }),
  q10_testable_assumption: z.enum(TESTABLE_ASSUMPTION, { message: 'Testable assumption is required' }),
  q11_time_to_signal: z.enum(TIME_TO_SIGNAL, { message: 'Time to signal is required' }),
  q12_cost_before_signal: z.enum(COST_BEFORE_SIGNAL, { message: 'Cost before signal is required' }),
  q13_attempts_per_month: z.enum(ATTEMPTS_PER_MONTH, { message: 'Attempts per month is required' }),
  q14_diagnose_failure: z.enum(DIAGNOSE_FAILURE, { message: 'Diagnose failure is required' }),
  q15_reversibility: z.enum(REVERSIBILITY, { message: 'Reversibility is required' }),
  q16_commitments_required: z.array(z.enum(COMMITMENT_REQUIRED)).min(1, 'At least one selection required'),
  q17_downside_if_fails: z.enum(DOWNSIDE_IF_FAILS, { message: 'Downside if fails is required' }),
  q18_primary_reason: z.enum(PRIMARY_REASON, { message: 'Primary reason is required' })
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = inputSchema.safeParse(body);

    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return NextResponse.json({ error: 'Validation failed', fields: fieldErrors }, { status: 400 });
    }

    const input: DecisionHygieneInput = parseResult.data;
    const result = evaluate(input);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Decision Hygiene evaluation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
