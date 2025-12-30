import { DecisionHygieneInput, EvaluationResult, Failure, FailureSection, Verdict } from './types';
import { getFailure } from './failureRegistry';

type RuleResult = { code: string; severity: 'RED' | 'YELLOW' } | null;

function evaluateSection1(input: DecisionHygieneInput): RuleResult[] {
  const results: RuleResult[] = [];

  if (input.q3_expected_price === '<$10' && input.q4_paying_users_required === '10,000+') {
    results.push({ code: 'economic_impossibility', severity: 'RED' });
  }
  if (input.q3_expected_price === '<$10' && input.q4_paying_users_required === '1,000–10,000') {
    results.push({ code: 'low_ticket_scale_trap', severity: 'YELLOW' });
  }
  if (input.q5_behavior_change === 'Major behavior change' && input.q9_attention_advantage !== 'Clear differentiated wedge') {
    results.push({ code: 'adoption_resistance', severity: 'RED' });
  }
  if (input.q6_success_depends_on.includes('Virality')) {
    results.push({ code: 'non_deterministic_dependency', severity: 'RED' });
  }
  if (input.q6_success_depends_on.includes('Platform featuring / algorithm boost')) {
    results.push({ code: 'external_permission_dependency', severity: 'RED' });
  }
  const nonNoneDeps = input.q6_success_depends_on.filter(d => d !== 'None');
  if (nonNoneDeps.length >= 2) {
    results.push({ code: 'compound_uncertainty', severity: 'RED' });
  }
  if (input.q6_success_depends_on.includes('Future unbuilt feature')) {
    results.push({ code: 'deferred_viability', severity: 'YELLOW' });
  }

  return results;
}

function evaluateSection2(input: DecisionHygieneInput): RuleResult[] {
  const results: RuleResult[] = [];

  if (input.q8_channel_control === 'No existing audience' && input.q7_first_channel === 'Paid ads') {
    results.push({ code: 'cac_exposure', severity: 'RED' });
  }
  if (input.q9_attention_advantage === 'Minimal differentiation') {
    results.push({ code: 'commodity_competition', severity: 'RED' });
  }
  if (input.q9_attention_advantage === 'Moderate improvement') {
    results.push({ code: 'weak_differentiation', severity: 'YELLOW' });
  }
  if (input.q10_testable_assumption === 'No — commitment comes first') {
    results.push({ code: 'discovery_after_commitment', severity: 'RED' });
  }
  if (input.q10_testable_assumption === 'Yes — but with meaningful effort') {
    results.push({ code: 'high_validation_cost', severity: 'YELLOW' });
  }

  return results;
}

function evaluateSection3(input: DecisionHygieneInput): RuleResult[] {
  const results: RuleResult[] = [];

  if (input.q11_time_to_signal === '3+ months') {
    results.push({ code: 'delayed_feedback_loop', severity: 'RED' });
  }
  if (input.q11_time_to_signal === '1–3 months') {
    results.push({ code: 'slow_feedback', severity: 'YELLOW' });
  }
  if (input.q12_cost_before_signal === '$10k+ or 200+ hours') {
    results.push({ code: 'high_sunk_cost_exposure', severity: 'RED' });
  }
  if (input.q12_cost_before_signal === '$1k–$10k or 50–200 hours') {
    results.push({ code: 'capital_risk_pre_validation', severity: 'YELLOW' });
  }
  if (input.q13_attempts_per_month === '<1') {
    results.push({ code: 'low_iteration_velocity', severity: 'RED' });
  }
  if (input.q13_attempts_per_month === '1–2') {
    results.push({ code: 'constrained_learning', severity: 'YELLOW' });
  }
  if (input.q14_diagnose_failure === 'No') {
    results.push({ code: 'opaque_failure', severity: 'RED' });
  }
  if (input.q14_diagnose_failure === 'Partially') {
    results.push({ code: 'ambiguous_learning', severity: 'YELLOW' });
  }

  return results;
}

function evaluateSection4(input: DecisionHygieneInput): RuleResult[] {
  const results: RuleResult[] = [];

  if (input.q15_reversibility === 'Irreversible') {
    results.push({ code: 'one_way_commitment', severity: 'RED' });
  }
  if (input.q15_reversibility === 'Hard to reverse') {
    results.push({ code: 'high_reversal_cost', severity: 'YELLOW' });
  }
  const nonNoneCommitments = input.q16_commitments_required.filter(c => c !== 'None');
  if (nonNoneCommitments.length >= 2) {
    results.push({ code: 'compound_commitment_risk', severity: 'RED' });
  }
  if (input.q16_commitments_required.includes('Significant capital') && input.q16_commitments_required.includes('Hiring')) {
    results.push({ code: 'capital_lock_in', severity: 'RED' });
  }
  if (input.q16_commitments_required.includes('Public brand identity')) {
    results.push({ code: 'identity_trap', severity: 'YELLOW' });
  }
  if (input.q17_downside_if_fails === 'Severe financial loss') {
    results.push({ code: 'asymmetric_downside', severity: 'RED' });
  }
  if (input.q17_downside_if_fails === 'Reputation damage') {
    results.push({ code: 'reputational_lock_in', severity: 'YELLOW' });
  }

  return results;
}

const VERDICT_EXPLANATIONS: Record<Verdict, string> = {
  GREEN: 'No catastrophic failure detected.',
  YELLOW: 'Risk is present.',
  RED: 'High-probability failure mode detected.'
};

export function evaluate(input: DecisionHygieneInput): EvaluationResult {
  const failures: Failure[] = [];
  let stoppedEarly = false;

  const sectionEvaluators = [
    evaluateSection1,
    evaluateSection2,
    evaluateSection3,
    evaluateSection4
  ];

  for (const evaluator of sectionEvaluators) {
    const results = evaluator(input);
    for (const result of results) {
      if (result) {
        const failure = getFailure(result.code);
        if (result.severity === 'RED') {
          failures.push(failure);
          stoppedEarly = true;
          return {
            verdict: 'RED',
            verdictExplanation: VERDICT_EXPLANATIONS.RED,
            failures,
            stoppedEarly
          };
        } else {
          failures.push(failure);
        }
      }
    }
  }

  const hasBias = input.q18_primary_reason === 'Emotional attachment';
  const hasYellow = failures.length > 0;

  const uniqueSections = new Set(failures.map(f => f.section));
  if (uniqueSections.size >= 3) {
    failures.push(getFailure('accumulated_uncertainty'));
    if (hasBias) {
      failures.push(getFailure('bias_present'));
    }
    return {
      verdict: 'RED',
      verdictExplanation: VERDICT_EXPLANATIONS.RED,
      failures,
      stoppedEarly: false
    };
  }

  if (hasBias && hasYellow) {
    failures.push(getFailure('bias_present'));
    return {
      verdict: 'RED',
      verdictExplanation: VERDICT_EXPLANATIONS.RED,
      failures,
      stoppedEarly: false
    };
  }

  if (hasBias && !hasYellow) {
    failures.push(getFailure('bias_present'));
    return {
      verdict: 'YELLOW',
      verdictExplanation: VERDICT_EXPLANATIONS.YELLOW,
      failures,
      stoppedEarly: false
    };
  }

  if (hasYellow) {
    return {
      verdict: 'YELLOW',
      verdictExplanation: VERDICT_EXPLANATIONS.YELLOW,
      failures,
      stoppedEarly: false
    };
  }

  return {
    verdict: 'GREEN',
    verdictExplanation: VERDICT_EXPLANATIONS.GREEN,
    failures: [],
    stoppedEarly: false
  };
}
