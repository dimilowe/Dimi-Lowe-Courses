import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | VCM Suite",
  description: "Contact VCM Suite support.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact</h1>

      <div className="space-y-4 text-gray-700">
        <p>
          Need help with a purchase, course access, or billing issue? Use the feedback button on the site and we
          will review your message directly.
        </p>
        <p>
          You can also open the form here:{" "}
          <Link href="/?feedback=general" className="text-orange-600 hover:text-orange-700 font-medium">
            Open Feedback Form
          </Link>
        </p>
      </div>
    </div>
  );
}
