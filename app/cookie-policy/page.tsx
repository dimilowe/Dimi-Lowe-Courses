import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | VCM Suite",
  description: "Cookie policy for VCM Suite.",
};

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Cookie Policy</h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. What Are Cookies</h2>
          <p>
            Cookies are small text files stored in your browser that help websites remember preferences,
            keep sessions active, and measure performance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How We Use Cookies</h2>
          <p>
            We use cookies and similar technologies for essential site functionality, session handling,
            analytics, and improving user experience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Third-Party Services</h2>
          <p>
            Some cookies may be set by third-party services integrated into the platform (for example,
            analytics or payment providers).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Managing Cookies</h2>
          <p>
            You can control cookies in your browser settings, including blocking or deleting them. Some
            features may not work correctly if essential cookies are disabled.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Updates</h2>
          <p>
            This policy may be updated from time to time. Continued use of the platform after updates
            means you accept the revised policy.
          </p>
        </section>
      </div>
    </div>
  );
}
