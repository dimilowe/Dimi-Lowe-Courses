type SeoSectionProps = {
  keyword: string;
  introTitle: string;
  introBody: string;
  introBody2: string;
  controls: Array<{ title: string; description: string }>;
  howToTitle: string;
  steps: string[];
  useCasesTitle: string;
  useCases: string[];
  relatedTitle: string;
  relatedBody: string;
  accentClassName?: string;
};

export default function AudioSeoSections({
  keyword,
  introTitle,
  introBody,
  introBody2,
  controls,
  howToTitle,
  steps,
  useCasesTitle,
  useCases,
  relatedTitle,
  relatedBody,
  accentClassName = "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50",
}: SeoSectionProps) {
  return (
    <>
      <section className={`mt-10 rounded-2xl border p-7 ${accentClassName}`}>
        <h2 className="text-2xl font-bold text-gray-900">{introTitle}</h2>
        <p className="mt-3 text-gray-700 leading-relaxed">
          {introBody} <strong>{keyword}</strong> {introBody2}
        </p>
        <p className="mt-3 text-gray-700 leading-relaxed">
          Preview playback runs instantly in your browser. Download rendering uses server Pedalboard processing when
          available, with browser fallback for reliable output.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {controls.map((control) => (
          <div key={control.title} className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900">{control.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{control.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">{howToTitle}</h2>
        <ol className="mt-4 space-y-3 text-gray-700">
          {steps.map((step, idx) => (
            <li key={step}>
              <strong>{idx + 1}.</strong> {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">{useCasesTitle}</h2>
        <ul className="mt-4 grid gap-3 text-gray-700 md:grid-cols-2">
          {useCases.map((item) => (
            <li key={item} className="rounded-lg bg-gray-50 p-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900">{relatedTitle}</h2>
        <p className="mt-3 text-gray-700">{relatedBody}</p>
      </section>
    </>
  );
}
