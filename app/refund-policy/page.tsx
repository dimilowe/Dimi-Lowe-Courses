import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | VCM Suite",
  description: "Refund policy for VCM Suite purchases.",
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Refund Policy</h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Digital Products</h2>
          <p>
            Because products and courses are digital and delivered immediately, refunds are generally not provided
            unless required by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Duplicate or Accidental Charges</h2>
          <p>
            If you were charged multiple times by mistake, contact us and we will investigate and correct valid
            duplicate charges.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Access Issues</h2>
          <p>
            If access was not properly granted after purchase, contact support first. We will prioritize restoring
            access before evaluating refund eligibility.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Contact for Billing</h2>
          <p>
            For billing or refund questions, use the feedback/contact channel on the site and include the purchase
            email and order details.
          </p>
        </section>
      </div>
    </div>
  );
}
