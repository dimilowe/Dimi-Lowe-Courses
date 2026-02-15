import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | VCM Suite",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
