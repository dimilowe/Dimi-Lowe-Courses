import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Username | VCM Suite",
  robots: { index: false, follow: false },
};

export default function ForgotUsernameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
