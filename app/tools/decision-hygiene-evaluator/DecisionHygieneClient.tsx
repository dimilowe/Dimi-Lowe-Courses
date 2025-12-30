"use client";

import { useState } from "react";

type Verdict = "GREEN" | "YELLOW" | "RED";

interface Failure {
  code: string;
  label: string;
  explanation: string;
  section: string;
}

interface EvaluationResult {
  verdict: Verdict;
  verdictExplanation: string;
  failures: Failure[];
  stoppedEarly: boolean;
}

interface FormState {
  q1_idea: string;
  q2_who_pays: string;
  q3_expected_price: string;
  q4_paying_users_required: string;
  q5_behavior_change: string;
  q6_success_depends_on: string[];
  q7_first_channel: string;
  q8_channel_control: string;
  q9_attention_advantage: string;
  q10_testable_assumption: string;
  q11_time_to_signal: string;
  q12_cost_before_signal: string;
  q13_attempts_per_month: string;
  q14_diagnose_failure: string;
  q15_reversibility: string;
  q16_commitments_required: string[];
  q17_downside_if_fails: string;
  q18_primary_reason: string;
}

const WHO_PAYS = [
  "Individual consumer",
  "Small business",
  "Mid-size business",
  "Enterprise",
  "Advertisers",
];

const EXPECTED_PRICE = ["<$10", "$10–$50", "$50–$200", "$200–$1,000", "$1,000+"];

const PAYING_USERS_REQUIRED = ["<100", "100–1,000", "1,000–10,000", "10,000+"];

const BEHAVIOR_CHANGE = [
  "No behavior change",
  "Small behavior change",
  "Major behavior change",
];

const SUCCESS_DEPENDENCY = [
  "None",
  "Virality",
  "Platform featuring / algorithm boost",
  "Press / influencer lift",
  "Regulatory approval",
  "Future unbuilt feature",
];

const ACQUISITION_CHANNEL = [
  "SEO",
  "YouTube",
  "Social short-form",
  "Paid ads",
  "Cold outreach",
  "Partnerships",
  "App store / marketplace",
];

const CHANNEL_CONTROL = [
  "Proven audience",
  "Small but real audience",
  "No existing audience",
];

const ATTENTION_ADVANTAGE = [
  "Clear differentiated wedge",
  "Moderate improvement",
  "Minimal differentiation",
];

const TESTABLE_ASSUMPTION = [
  "Yes — cheaply and quickly",
  "Yes — but with meaningful effort",
  "No — commitment comes first",
];

const TIME_TO_SIGNAL = ["<7 days", "7–30 days", "1–3 months", "3+ months"];

const COST_BEFORE_SIGNAL = [
  "<$100 or <10 hours",
  "$100–$1k or 10–50 hours",
  "$1k–$10k or 50–200 hours",
  "$10k+ or 200+ hours",
];

const ATTEMPTS_PER_MONTH = ["10+", "3–9", "1–2", "<1"];

const DIAGNOSE_FAILURE = ["Yes", "Partially", "No"];

const REVERSIBILITY = [
  "Fully reversible",
  "Mostly reversible",
  "Hard to reverse",
  "Irreversible",
];

const COMMITMENT_REQUIRED = [
  "None",
  "Significant capital",
  "Hiring",
  "Public brand identity",
  "Long-term contracts",
  "Custom infrastructure",
];

const DOWNSIDE_IF_FAILS = [
  "Minor time loss",
  "Moderate time/money loss",
  "Severe financial loss",
  "Reputation damage",
];

const PRIMARY_REASON = [
  "Clear market signal",
  "Existing unfair advantage",
  "Curiosity / interest",
  "Emotional attachment",
];

const initialFormState: FormState = {
  q1_idea: "",
  q2_who_pays: "",
  q3_expected_price: "",
  q4_paying_users_required: "",
  q5_behavior_change: "",
  q6_success_depends_on: [],
  q7_first_channel: "",
  q8_channel_control: "",
  q9_attention_advantage: "",
  q10_testable_assumption: "",
  q11_time_to_signal: "",
  q12_cost_before_signal: "",
  q13_attempts_per_month: "",
  q14_diagnose_failure: "",
  q15_reversibility: "",
  q16_commitments_required: [],
  q17_downside_if_fails: "",
  q18_primary_reason: "",
};

function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600"
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={(e) => onChange(e.target.value)}
              className="h-4 w-4 text-zinc-900 border-zinc-300 focus:ring-zinc-500"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function CheckboxGroup({
  name,
  label,
  options,
  values,
  onChange,
}: {
  name: string;
  label: string;
  options: string[];
  values: string[];
  onChange: (vals: string[]) => void;
}) {
  const handleChange = (opt: string, checked: boolean) => {
    if (opt === "None") {
      onChange(checked ? ["None"] : []);
    } else {
      const filtered = values.filter((v) => v !== "None");
      if (checked) {
        onChange([...filtered, opt]);
      } else {
        onChange(filtered.filter((v) => v !== opt));
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600"
          >
            <input
              type="checkbox"
              name={name}
              value={opt}
              checked={values.includes(opt)}
              onChange={(e) => handleChange(opt, e.target.checked)}
              className="h-4 w-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-500"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function DecisionHygieneClient() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFormComplete = () => {
    return (
      form.q1_idea.trim().length > 0 &&
      form.q2_who_pays !== "" &&
      form.q3_expected_price !== "" &&
      form.q4_paying_users_required !== "" &&
      form.q5_behavior_change !== "" &&
      form.q6_success_depends_on.length > 0 &&
      form.q7_first_channel !== "" &&
      form.q8_channel_control !== "" &&
      form.q9_attention_advantage !== "" &&
      form.q10_testable_assumption !== "" &&
      form.q11_time_to_signal !== "" &&
      form.q12_cost_before_signal !== "" &&
      form.q13_attempts_per_month !== "" &&
      form.q14_diagnose_failure !== "" &&
      form.q15_reversibility !== "" &&
      form.q16_commitments_required.length > 0 &&
      form.q17_downside_if_fails !== "" &&
      form.q18_primary_reason !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/decision-hygiene-evaluator/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Evaluation failed.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setForm(initialFormState);
  };

  const getVerdictStyles = (verdict: Verdict) => {
    switch (verdict) {
      case "RED":
        return {
          bg: "bg-red-50",
          border: "border-red-300",
          headline: "text-red-700",
          badge: "bg-red-600 text-white",
        };
      case "YELLOW":
        return {
          bg: "bg-amber-50",
          border: "border-amber-300",
          headline: "text-amber-700",
          badge: "bg-amber-500 text-white",
        };
      case "GREEN":
        return {
          bg: "bg-green-50",
          border: "border-green-300",
          headline: "text-green-700",
          badge: "bg-green-600 text-white",
        };
    }
  };

  if (result) {
    const styles = getVerdictStyles(result.verdict);

    return (
      <div
        className={`max-w-2xl mx-auto p-8 rounded-2xl border-2 ${styles.bg} ${styles.border}`}
      >
        <div className="text-center mb-6">
          <span
            className={`inline-block px-4 py-2 rounded-lg text-sm font-bold tracking-wide ${styles.badge}`}
          >
            {result.verdict}
          </span>
          <p className={`mt-3 text-lg font-medium ${styles.headline}`}>
            {result.verdictExplanation}
          </p>
          {result.stoppedEarly && (
            <p className="mt-2 text-xs text-zinc-500 italic">
              Evaluation stopped at first RED.
            </p>
          )}
        </div>

        {result.failures.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
              Triggered Failures
            </h3>
            {result.failures.map((f, i) => (
              <div
                key={i}
                className="bg-white/70 border border-zinc-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-zinc-800">
                    {f.label}
                  </span>
                  <span className="text-xs text-zinc-400 px-1.5 py-0.5 bg-zinc-100 rounded">
                    {f.section}
                  </span>
                </div>
                <p className="text-sm text-zinc-600">{f.explanation}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleReset}
          className="mt-8 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition"
        >
          Evaluate Another Decision
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-8"
    >
      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">
          Section 1: Structural Viability
        </h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700">
            One-sentence idea (max 200 characters)
          </label>
          <input
            type="text"
            maxLength={200}
            value={form.q1_idea}
            onChange={(e) => setForm({ ...form, q1_idea: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
            placeholder="Describe the idea in one sentence"
          />
          <p className="text-xs text-zinc-400 text-right">
            {form.q1_idea.length}/200
          </p>
        </div>

        <RadioGroup
          name="q2"
          label="Who pays?"
          options={WHO_PAYS}
          value={form.q2_who_pays}
          onChange={(v) => setForm({ ...form, q2_who_pays: v })}
        />

        <RadioGroup
          name="q3"
          label="Expected price per paying user?"
          options={EXPECTED_PRICE}
          value={form.q3_expected_price}
          onChange={(v) => setForm({ ...form, q3_expected_price: v })}
        />

        <RadioGroup
          name="q4"
          label="Paying users required to survive?"
          options={PAYING_USERS_REQUIRED}
          value={form.q4_paying_users_required}
          onChange={(v) => setForm({ ...form, q4_paying_users_required: v })}
        />

        <RadioGroup
          name="q5"
          label="Behavior change required?"
          options={BEHAVIOR_CHANGE}
          value={form.q5_behavior_change}
          onChange={(v) => setForm({ ...form, q5_behavior_change: v })}
        />

        <CheckboxGroup
          name="q6"
          label="Success depends on (select all that apply)"
          options={SUCCESS_DEPENDENCY}
          values={form.q6_success_depends_on}
          onChange={(v) => setForm({ ...form, q6_success_depends_on: v })}
        />
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">
          Section 2: Distribution Asymmetry
        </h2>

        <RadioGroup
          name="q7"
          label="First acquisition channel"
          options={ACQUISITION_CHANNEL}
          value={form.q7_first_channel}
          onChange={(v) => setForm({ ...form, q7_first_channel: v })}
        />

        <RadioGroup
          name="q8"
          label="Control over this channel"
          options={CHANNEL_CONTROL}
          value={form.q8_channel_control}
          onChange={(v) => setForm({ ...form, q8_channel_control: v })}
        />

        <RadioGroup
          name="q9"
          label="Why you win attention vs alternatives"
          options={ATTENTION_ADVANTAGE}
          value={form.q9_attention_advantage}
          onChange={(v) => setForm({ ...form, q9_attention_advantage: v })}
        />

        <RadioGroup
          name="q10"
          label="Can the core assumption be tested before commitment?"
          options={TESTABLE_ASSUMPTION}
          value={form.q10_testable_assumption}
          onChange={(v) => setForm({ ...form, q10_testable_assumption: v })}
        />
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">
          Section 3: Effort-to-Feedback Ratio
        </h2>

        <RadioGroup
          name="q11"
          label="Time to first real signal"
          options={TIME_TO_SIGNAL}
          value={form.q11_time_to_signal}
          onChange={(v) => setForm({ ...form, q11_time_to_signal: v })}
        />

        <RadioGroup
          name="q12"
          label="Cost before first signal"
          options={COST_BEFORE_SIGNAL}
          value={form.q12_cost_before_signal}
          onChange={(v) => setForm({ ...form, q12_cost_before_signal: v })}
        />

        <RadioGroup
          name="q13"
          label="Attempts per month possible"
          options={ATTEMPTS_PER_MONTH}
          value={form.q13_attempts_per_month}
          onChange={(v) => setForm({ ...form, q13_attempts_per_month: v })}
        />

        <RadioGroup
          name="q14"
          label="Can you clearly diagnose failure causes?"
          options={DIAGNOSE_FAILURE}
          value={form.q14_diagnose_failure}
          onChange={(v) => setForm({ ...form, q14_diagnose_failure: v })}
        />
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">
          Section 4: Decision Reversibility
        </h2>

        <RadioGroup
          name="q15"
          label="Reversibility of the decision"
          options={REVERSIBILITY}
          value={form.q15_reversibility}
          onChange={(v) => setForm({ ...form, q15_reversibility: v })}
        />

        <CheckboxGroup
          name="q16"
          label="Commitments required before validation"
          options={COMMITMENT_REQUIRED}
          values={form.q16_commitments_required}
          onChange={(v) => setForm({ ...form, q16_commitments_required: v })}
        />

        <RadioGroup
          name="q17"
          label="Downside if this fails"
          options={DOWNSIDE_IF_FAILS}
          value={form.q17_downside_if_fails}
          onChange={(v) => setForm({ ...form, q17_downside_if_fails: v })}
        />
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-zinc-800 border-b pb-2">
          Section 5: Bias Check
        </h2>

        <RadioGroup
          name="q18"
          label="Primary reason you want to pursue this"
          options={PRIMARY_REASON}
          value={form.q18_primary_reason}
          onChange={(v) => setForm({ ...form, q18_primary_reason: v })}
        />
      </section>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!isFormComplete() || loading}
        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
      >
        {loading ? "Evaluating..." : "Evaluate Decision"}
      </button>
    </form>
  );
}
