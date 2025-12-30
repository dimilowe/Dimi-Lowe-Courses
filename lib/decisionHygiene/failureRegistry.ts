import { FailureSection } from './types';

interface FailureDefinition {
  label: string;
  explanation: string;
  section: FailureSection;
}

export const FAILURE_REGISTRY: Record<string, FailureDefinition> = {
  economic_impossibility: {
    label: 'Economic Impossibility',
    explanation: 'What failed: The numbers do not support survival. Why: Even optimistic outcomes do not clear basic economic thresholds. Meaning: Continuing converts time into guaranteed loss.',
    section: 'Structural'
  },
  low_ticket_scale_trap: {
    label: 'Low-Ticket Scale Trap',
    explanation: 'What failed: Revenue per user is too low relative to required scale. Why: Scale must be achieved before validation, increasing exposure. Meaning: Success requires volume before proof.',
    section: 'Structural'
  },
  adoption_resistance: {
    label: 'Adoption Resistance',
    explanation: 'What failed: The idea requires major behavior change without sufficient leverage. Why: Habit change is one of the highest friction barriers. Meaning: Adoption cost likely exceeds user motivation.',
    section: 'Structural'
  },
  non_deterministic_dependency: {
    label: 'Non-Deterministic Dependency',
    explanation: 'What failed: Success depends on events you do not control. Why: Outcomes cannot be reliably repeated or tested. Meaning: Results are governed by luck, not execution.',
    section: 'Structural'
  },
  external_permission_dependency: {
    label: 'External Permission Dependency',
    explanation: 'What failed: Viability depends on platform approval or special access. Why: Control over outcomes is external. Meaning: Progress can be halted without warning.',
    section: 'Structural'
  },
  compound_uncertainty: {
    label: 'Compound Uncertainty',
    explanation: 'What failed: Multiple external dependencies stack. Why: Each dependency multiplies risk. Meaning: The overall error band is unacceptable.',
    section: 'Structural'
  },
  deferred_viability: {
    label: 'Deferred Viability',
    explanation: 'What failed: Core functionality required for success does not yet exist. Why: Validation is postponed until after commitment. Meaning: You are investing before knowing what you are investing in.',
    section: 'Structural'
  },
  cac_exposure: {
    label: 'CAC Exposure',
    explanation: 'What failed: Paid acquisition is required without cost advantage. Why: Economics are unproven and likely unfavorable. Meaning: Growth increases losses.',
    section: 'Distribution'
  },
  commodity_competition: {
    label: 'Commodity Competition',
    explanation: 'What failed: No meaningful differentiation. Why: Attention defaults to incumbents. Meaning: Competing requires superior resources, not better ideas.',
    section: 'Distribution'
  },
  weak_differentiation: {
    label: 'Weak Differentiation',
    explanation: 'What failed: Advantage is incremental, not decisive. Why: Small improvements rarely displace existing behavior. Meaning: Outcomes depend on persistence, not leverage.',
    section: 'Distribution'
  },
  discovery_after_commitment: {
    label: 'Discovery After Commitment',
    explanation: 'What failed: Validation occurs only after irreversible effort. Why: Feedback arrives too late to protect downside. Meaning: Failure is expensive by design.',
    section: 'Distribution'
  },
  high_validation_cost: {
    label: 'High Validation Cost',
    explanation: 'What failed: Testing is possible, but not cheap. Why: High validation cost increases exposure before proof. Meaning: Early mistakes become expensive.',
    section: 'Distribution'
  },
  delayed_feedback_loop: {
    label: 'Delayed Feedback Loop',
    explanation: 'What failed: Reality responds too slowly. Why: Long feedback cycles amplify sunk-cost bias. Meaning: You will defend the idea before understanding it.',
    section: 'Feedback'
  },
  slow_feedback: {
    label: 'Slow Feedback',
    explanation: 'What failed: Feedback arrives late. Why: Slow cycles reduce learning rate. Meaning: Progress is fragile.',
    section: 'Feedback'
  },
  high_sunk_cost_exposure: {
    label: 'High Sunk-Cost Exposure',
    explanation: 'What failed: Significant resources are required before learning. Why: Early losses are difficult to reverse. Meaning: Mistakes compound.',
    section: 'Feedback'
  },
  capital_risk_pre_validation: {
    label: 'Capital Risk Pre-Validation',
    explanation: 'What failed: Material resources are committed before proof. Why: Capital loss reduces optionality. Meaning: This decision limits future decisions.',
    section: 'Feedback'
  },
  low_iteration_velocity: {
    label: 'Low Iteration Velocity',
    explanation: 'What failed: Attempts cannot be repeated quickly. Why: Learning rate is capped. Meaning: Improvement is slow and fragile.',
    section: 'Feedback'
  },
  constrained_learning: {
    label: 'Constrained Learning',
    explanation: 'What failed: Few attempts are possible. Why: Low repetition slows signal discovery. Meaning: You will spend time waiting, not learning.',
    section: 'Feedback'
  },
  opaque_failure: {
    label: 'Opaque Failure',
    explanation: 'What failed: Failure causes are not diagnosable. Why: Learning is indistinguishable from noise. Meaning: Repeated attempts do not improve odds.',
    section: 'Feedback'
  },
  ambiguous_learning: {
    label: 'Ambiguous Learning',
    explanation: 'What failed: Failure causes are partially diagnosable. Why: Partial signal slows improvement. Meaning: Iteration may not converge.',
    section: 'Feedback'
  },
  one_way_commitment: {
    label: 'One-Way Commitment',
    explanation: 'What failed: The decision cannot be undone. Why: Reversibility is required for early-stage uncertainty. Meaning: You are locking risk in permanently.',
    section: 'Reversibility'
  },
  high_reversal_cost: {
    label: 'High Reversal Cost',
    explanation: 'What failed: Reversing the decision is difficult. Why: High reversal costs discourage correction. Meaning: You may continue past the evidence.',
    section: 'Reversibility'
  },
  compound_commitment_risk: {
    label: 'Compound Commitment Risk',
    explanation: 'What failed: Multiple irreversible commitments stack. Why: Combined commitments reduce optionality. Meaning: A wrong bet becomes hard to exit.',
    section: 'Reversibility'
  },
  capital_lock_in: {
    label: 'Capital Lock-In',
    explanation: 'What failed: Capital and hiring are committed before validation. Why: Fixed costs accelerate downside. Meaning: Growth pressure replaces learning.',
    section: 'Reversibility'
  },
  identity_trap: {
    label: 'Identity Trap',
    explanation: 'What failed: Public identity is committed before validation. Why: Social cost discourages reversal. Meaning: You may continue to avoid embarrassment, not because it works.',
    section: 'Reversibility'
  },
  asymmetric_downside: {
    label: 'Asymmetric Downside',
    explanation: 'What failed: Loss magnitude outweighs potential learning. Why: Downside is not survivable. Meaning: A single failure can end the game.',
    section: 'Reversibility'
  },
  reputational_lock_in: {
    label: 'Reputational Lock-In',
    explanation: 'What failed: Reputation is at risk before proof. Why: Reputational damage discourages iteration. Meaning: You will avoid honest testing.',
    section: 'Reversibility'
  },
  accumulated_uncertainty: {
    label: 'Accumulated Uncertainty',
    explanation: 'What failed: Multiple medium risks compound. Why: Each weak assumption multiplies error. Meaning: The overall bet quality is unacceptable.',
    section: 'Structural'
  },
  bias_present: {
    label: 'Bias Present',
    explanation: 'What failed: Motivation may distort judgment. Why: Emotional attachment reduces objectivity. Meaning: Marginal risks become decisive.',
    section: 'Bias'
  }
};

export function getFailure(code: string) {
  const def = FAILURE_REGISTRY[code];
  if (!def) throw new Error(`Unknown failure code: ${code}`);
  return { code, ...def };
}
