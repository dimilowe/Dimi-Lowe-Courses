import { Metadata } from "next";
import DecisionHygieneClient from "./DecisionHygieneClient";
import ExploreMoreTools from "@/components/ExploreMoreTools";

export const metadata: Metadata = {
  title: "Decision Hygiene Evaluator | Pre-Commitment Filter for Business Ideas",
  description:
    "A deterministic pre-commitment filter that detects high-probability failure modes in business decisions. RED / YELLOW / GREEN verdicts. No coaching. No suggestions. Just the truth.",
  keywords: [
    "decision hygiene",
    "pre-commitment filter",
    "business idea validator",
    "startup idea evaluator",
    "avoid wasting time",
    "validate idea before committing",
    "business decision tool",
    "idea risk assessment",
    "commitment filter",
    "decision quality",
  ],
  openGraph: {
    title: "Decision Hygiene Evaluator | Pre-Commitment Filter",
    description:
      "Deterministic pre-commitment filter that detects high-probability failure modes. RED / YELLOW / GREEN verdicts.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Decision Hygiene Evaluator | Pre-Commitment Filter",
    description:
      "Deterministic pre-commitment filter that detects high-probability failure modes. RED / YELLOW / GREEN verdicts.",
  },
};

const faqs = [
  {
    question: "What is decision hygiene?",
    answer:
      "Decision hygiene refers to practices that reduce noise and bias in judgment before commitment. This tool applies structured evaluation to detect failure modes early, before resources are invested.",
  },
  {
    question: "What does a RED verdict mean?",
    answer:
      "RED means a high-probability failure mode was detected. The structural characteristics of this decision suggest it will likely fail regardless of execution quality. Do not proceed.",
  },
  {
    question: "What does a YELLOW verdict mean?",
    answer:
      "YELLOW means risk is present. One or more warning signals were triggered. Proceed with awareness that conditions are not ideal and failure probability is elevated.",
  },
  {
    question: "What does a GREEN verdict mean?",
    answer:
      "GREEN means no catastrophic failure mode was detected. It does not guarantee success. It means the decision does not contain structural patterns that predict failure.",
  },
  {
    question: "Why are there no suggestions or fixes?",
    answer:
      "This is a pre-commitment filter, not a coach. Its purpose is to say no when the risk is too high. If a decision triggers RED, the correct action is to find a different decision—not to optimize a fundamentally weak one.",
  },
  {
    question: "Is this tool powered by AI?",
    answer:
      "No. This tool is entirely deterministic. It uses a fixed rule engine that evaluates your inputs against known failure patterns. The same inputs always produce the same output. No AI, no randomness.",
  },
  {
    question: "What if I disagree with the result?",
    answer:
      "The tool evaluates structural risk based on your stated inputs. If you believe the result is wrong, examine whether your inputs accurately reflect reality. The tool cannot be negotiated with.",
  },
  {
    question: "Does this replace market research?",
    answer:
      "No. This tool identifies structural failure modes before research begins. It filters decisions that should not receive further investment of time or money. Valid decisions still require research.",
  },
];

function SoftwareApplicationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Decision Hygiene Evaluator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "A deterministic pre-commitment filter that detects high-probability failure modes in business decisions before resources are committed.",
    featureList: [
      "18-question structured evaluation",
      "RED / YELLOW / GREEN verdicts",
      "Early termination on first RED",
      "Bias escalation detection",
      "Accumulated uncertainty detection",
      "No AI—deterministic rule engine",
      "No suggestions or coaching",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function DecisionHygieneEvaluatorPage() {
  return (
    <>
      <SoftwareApplicationSchema />
      <FAQSchema />

      <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-3">
              Decision Hygiene Evaluator
            </h1>
            <p className="text-zinc-600 max-w-xl mx-auto">
              A pre-commitment filter that detects high-probability failure
              modes. Answer all questions. Receive a final verdict. No coaching.
              No suggestions.
            </p>
          </div>

          <DecisionHygieneClient />

          <section className="mt-16 prose prose-zinc max-w-none">
            <h2>What is Decision Hygiene?</h2>
            <p>
              Decision hygiene is the practice of reducing bias and noise in
              judgment before making irreversible commitments. Most bad decisions
              are not made because people lack intelligence—they fail because
              structural conditions made failure likely from the start.
            </p>
            <p>
              This tool evaluates 18 critical factors across five dimensions:
              structural viability, distribution asymmetry, effort-to-feedback
              ratio, decision reversibility, and bias presence. Each factor is
              tested against known failure patterns. When a pattern is detected,
              it triggers a failure class.
            </p>

            <h2>How It Works</h2>
            <p>
              Complete all 18 questions honestly. The evaluator runs a
              deterministic rule engine against your responses. If a
              high-probability failure mode is detected, evaluation stops
              immediately with a RED verdict. If multiple medium-risk signals
              accumulate across different dimensions, the verdict escalates to
              RED. Emotional attachment in the presence of any warning signal also
              escalates the verdict.
            </p>
            <p>
              The result includes the verdict, a brief explanation, and a list of
              all triggered failure classes. There are no suggestions for
              improvement. If a decision receives RED, the correct action is to
              pursue a different decision.
            </p>

            <h2>Why No Suggestions?</h2>
            <p>
              Suggestions imply that a failing structure can be fixed. In most
              cases, it cannot. Optimizing a fundamentally weak decision wastes
              time that could be spent on a structurally sound one. This tool
              exists to say no—quickly and without negotiation.
            </p>
          </section>

          <section className="mt-16">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-zinc-100 pb-4">
                  <h3 className="font-semibold text-zinc-800 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-zinc-600 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-16">
            <ExploreMoreTools currentTool="/tools/decision-hygiene-evaluator" />
          </div>
        </div>
      </main>
    </>
  );
}
