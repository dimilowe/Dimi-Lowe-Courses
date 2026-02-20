import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | VCM Suite",
  description: "Terms and conditions for using VCM Suite.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms & Conditions</h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using VCM Suite, you agree to these Terms & Conditions. If you do not agree,
            do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Accounts and Access</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activity under your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Purchases and Course Access</h2>
          <p>
            Course and product access is granted according to your completed purchase. Access may be suspended
            for abuse, fraud, or violation of these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Acceptable Use</h2>
          <p>
            You may not use the platform for unlawful activity, abuse of services, unauthorized access, or
            infringement of third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Intellectual Property</h2>
          <p>
            Platform branding, site content, and proprietary assets are owned by VCM Suite or its licensors.
            Purchased content is licensed for your intended personal/business use unless otherwise stated.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Limitation of Liability</h2>
          <p>
            VCM Suite is provided on an “as is” basis. To the maximum extent permitted by law, VCM Suite is
            not liable for indirect, incidental, or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after updates means
            you accept the revised terms.
          </p>
        </section>
      </div>
    </div>
  );
}
