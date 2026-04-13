import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/contexts/CartContext";
import { AppProvider } from "@/components/providers/AppProvider";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import FloatingToolsButton from "@/components/FloatingToolsButton";
import SiteFooter from "@/components/SiteFooter";
import { FeedbackLauncherButton } from "@/components/FeedbackLauncherButton";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"] });
const SUNSET_MODE = false;

export const metadata: Metadata = {
  title: "VCM Suite - Creator Store",
  description: "Apps, downloads, templates, and creator resources from VCM Suite.",
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VCM Suite - Creator Store",
    description: "Apps, downloads, templates, and creator resources from VCM Suite.",
    url: "/",
    siteName: "VCM Suite",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {SUNSET_MODE ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <CartProvider>
            <AppProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
                <SiteFooter />
              </div>
              <FeedbackLauncherButton />
              <FeedbackDialog hideTrigger />
              <FloatingToolsButton />
            </AppProvider>
          </CartProvider>
        )}
      </body>
    </html>
  );
}
