export type Verdict = 'GREEN' | 'YELLOW' | 'RED';

export type FailureSection = 'Structural' | 'Distribution' | 'Feedback' | 'Reversibility' | 'Bias';

export interface Failure {
  code: string;
  label: string;
  explanation: string;
  section: FailureSection;
}

export interface EvaluationResult {
  verdict: Verdict;
  verdictExplanation: string;
  failures: Failure[];
  stoppedEarly: boolean;
}

export type WhoPays = 
  | 'Individual consumer'
  | 'Small business'
  | 'Mid-size business'
  | 'Enterprise'
  | 'Advertisers';

export type ExpectedPrice =
  | '<$10'
  | '$10–$50'
  | '$50–$200'
  | '$200–$1,000'
  | '$1,000+';

export type PayingUsersRequired =
  | '<100'
  | '100–1,000'
  | '1,000–10,000'
  | '10,000+';

export type BehaviorChange =
  | 'No behavior change'
  | 'Small behavior change'
  | 'Major behavior change';

export type SuccessDependency =
  | 'None'
  | 'Virality'
  | 'Platform featuring / algorithm boost'
  | 'Press / influencer lift'
  | 'Regulatory approval'
  | 'Future unbuilt feature';

export type AcquisitionChannel =
  | 'SEO'
  | 'YouTube'
  | 'Social short-form'
  | 'Paid ads'
  | 'Cold outreach'
  | 'Partnerships'
  | 'App store / marketplace';

export type ChannelControl =
  | 'Proven audience'
  | 'Small but real audience'
  | 'No existing audience';

export type AttentionAdvantage =
  | 'Clear differentiated wedge'
  | 'Moderate improvement'
  | 'Minimal differentiation';

export type TestableAssumption =
  | 'Yes — cheaply and quickly'
  | 'Yes — but with meaningful effort'
  | 'No — commitment comes first';

export type TimeToSignal =
  | '<7 days'
  | '7–30 days'
  | '1–3 months'
  | '3+ months';

export type CostBeforeSignal =
  | '<$100 or <10 hours'
  | '$100–$1k or 10–50 hours'
  | '$1k–$10k or 50–200 hours'
  | '$10k+ or 200+ hours';

export type AttemptsPerMonth =
  | '10+'
  | '3–9'
  | '1–2'
  | '<1';

export type DiagnoseFailure =
  | 'Yes'
  | 'Partially'
  | 'No';

export type Reversibility =
  | 'Fully reversible'
  | 'Mostly reversible'
  | 'Hard to reverse'
  | 'Irreversible';

export type CommitmentRequired =
  | 'None'
  | 'Significant capital'
  | 'Hiring'
  | 'Public brand identity'
  | 'Long-term contracts'
  | 'Custom infrastructure';

export type DownsideIfFails =
  | 'Minor time loss'
  | 'Moderate time/money loss'
  | 'Severe financial loss'
  | 'Reputation damage';

export type PrimaryReason =
  | 'Clear market signal'
  | 'Existing unfair advantage'
  | 'Curiosity / interest'
  | 'Emotional attachment';

export interface DecisionHygieneInput {
  q1_idea: string;
  q2_who_pays: WhoPays;
  q3_expected_price: ExpectedPrice;
  q4_paying_users_required: PayingUsersRequired;
  q5_behavior_change: BehaviorChange;
  q6_success_depends_on: SuccessDependency[];
  q7_first_channel: AcquisitionChannel;
  q8_channel_control: ChannelControl;
  q9_attention_advantage: AttentionAdvantage;
  q10_testable_assumption: TestableAssumption;
  q11_time_to_signal: TimeToSignal;
  q12_cost_before_signal: CostBeforeSignal;
  q13_attempts_per_month: AttemptsPerMonth;
  q14_diagnose_failure: DiagnoseFailure;
  q15_reversibility: Reversibility;
  q16_commitments_required: CommitmentRequired[];
  q17_downside_if_fails: DownsideIfFails;
  q18_primary_reason: PrimaryReason;
}
