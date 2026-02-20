import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | VCM Suite",
  description: "Privacy policy for VCM Suite.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
          <p>
            We may collect account details (such as email), purchase records, and usage data needed to provide
            platform features and support.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How We Use Information</h2>
          <p>
            We use your information to operate the site, provide purchased access, process transactions, improve
            the platform, and communicate important updates.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Payments</h2>
          <p>
            Payments are handled by third-party providers (such as Stripe). We do not store your full payment
            card details on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share limited data with service providers required to run
            the platform, comply with law, or prevent fraud.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Data Retention</h2>
          <p>
            We retain data as long as needed to provide services, maintain records, comply with legal obligations,
            and resolve disputes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Your Rights</h2>
          <p>
            Depending on your location, you may have rights to request access, correction, or deletion of personal
            data. Contact us through the feedback form for requests.
          </p>
        </section>
      </div>
    </div>
  );
}
