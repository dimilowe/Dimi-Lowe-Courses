import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA Policy | VCM Suite",
  description: "DMCA and copyright policy for VCM Suite.",
};

export default function DmcaPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">DMCA Policy</h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Copyright Respect</h2>
          <p>
            VCM Suite respects intellectual property rights. If you believe content on this platform
            infringes your copyright, you may submit a DMCA notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. DMCA Notice Requirements</h2>
          <p>
            Your notice should include: identification of the copyrighted work, identification of the
            allegedly infringing material, your contact details, a good-faith statement, and a statement
            under penalty of perjury that the information is accurate and you are authorized to act.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Counter-Notification</h2>
          <p>
            If your content was removed and you believe that was an error, you may send a counter-notification
            that includes legally required statements and contact information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Repeat Infringers</h2>
          <p>
            We may suspend or terminate accounts of users who repeatedly violate copyright law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Contact</h2>
          <p>
            To submit a DMCA notice or counter-notice, use the site contact/feedback channel and include
            all relevant details so we can process your request promptly.
          </p>
        </section>
      </div>
    </div>
  );
}
