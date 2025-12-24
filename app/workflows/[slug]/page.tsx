import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { getWorkflowBySlug, getRelatedWorkflows, getWorkflows } from "@/lib/workflows/workflows";
import WorkflowBadges from "@/components/workflows/WorkflowBadges";
import WorkflowStepCard from "@/components/workflows/WorkflowStepCard";
import RelatedWorkflows from "@/components/workflows/RelatedWorkflows";
import { query } from "@/lib/db";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getAvailableTools(): Promise<Set<string>> {
  try {
    const result = await query("SELECT slug FROM tools WHERE in_directory = true");
    return new Set(result.rows.map((row: { slug: string }) => row.slug));
  } catch {
    return new Set();
  }
}

export async function generateStaticParams() {
  const workflows = getWorkflows();
  return workflows.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const workflow = getWorkflowBySlug(slug);

  if (!workflow) {
    return { title: "Workflow Not Found" };
  }

  return {
    title: workflow.seo.title,
    description: workflow.seo.description,
    keywords: workflow.seo.keywords,
    robots: workflow.isIndexed ? "index, follow" : "noindex, nofollow",
    openGraph: {
      title: workflow.seo.title,
      description: workflow.seo.description,
      type: "article"
    }
  };
}

function generateHowToSchema(workflow: NonNullable<ReturnType<typeof getWorkflowBySlug>>) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: workflow.title,
    description: workflow.seo.description,
    totalTime: workflow.time_to_first_result,
    step: workflow.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.title,
      text: step.instruction,
      ...(step.tool_slug && {
        url: `https://vcmsuite.com/tools/${step.tool_slug}`
      })
    }))
  };
}

export default async function WorkflowDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const workflow = getWorkflowBySlug(slug);

  if (!workflow) {
    notFound();
  }

  const relatedWorkflows = getRelatedWorkflows(workflow, 3);
  const availableTools = await getAvailableTools();
  const schema = generateHowToSchema(workflow);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Workflows
          </Link>

          <header className="mb-12">
            <WorkflowBadges
              outcome_tag={workflow.outcome_tag}
              difficulty={workflow.difficulty}
              time_to_first_result={workflow.time_to_first_result}
            />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-6 mb-4">
              {workflow.title}
            </h1>
            <p className="text-xl text-gray-600">
              {workflow.pain_subtitle}
            </p>
          </header>

          <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-12">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <Lightbulb className="h-5 w-5 text-orange-500" />
              Why This Workflow Works
            </h2>
            <ul className="space-y-3">
              {workflow.why_this_works.map((reason, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              The {workflow.steps.length}-Step Process
            </h2>
            <div className="space-y-6">
              {workflow.steps.map((step, i) => (
                <WorkflowStepCard
                  key={i}
                  step={step}
                  stepNumber={i + 1}
                  availableTools={availableTools}
                />
              ))}
            </div>
          </section>

          <section className="bg-red-50 rounded-2xl border border-red-200 p-6 mb-12">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-red-800 mb-4">
              <AlertTriangle className="h-5 w-5" />
              Common Failure Points
            </h2>
            <ul className="space-y-2">
              {workflow.failure_points.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-red-700">
                  <span className="text-red-400">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-green-50 rounded-2xl border border-green-200 p-6 mb-12">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-green-800 mb-4">
              <CheckCircle2 className="h-5 w-5" />
              Expected Outcome
            </h2>
            <p className="text-green-700">
              {workflow.expected_outcome}
            </p>
          </section>

          <RelatedWorkflows workflows={relatedWorkflows} />
        </div>
      </main>
    </>
  );
}
