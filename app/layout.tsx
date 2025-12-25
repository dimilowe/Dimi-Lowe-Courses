import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/contexts/CartContext";
import FloatingToolsButton from "@/components/FloatingToolsButton";
import { AppProvider } from "@/components/providers/AppProvider";
import { getCurrentUserWithTier } from "@/lib/pricing/getCurrentUserWithTier";
import type { UserTier } from "@/lib/pricing/types";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VCM Suite - Free Tools & Resources for Creators",
  description: "Free tools and resources to help creators grow, engage, and monetize their creative business.",
  verification: {
    google: '5cb76b900fd3341c',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUserWithTier();
  const currentTier: UserTier = user?.subscription_tier || 'free';

  return (
    <html lang="en">
      <head>
        <Script id="internal-user-flag" strategy="beforeInteractive">
          {`
            if (localStorage.getItem('vcm_internal_user') === 'true') {
              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                user_properties: { internal_user: 'true' }
              });
            }
          `}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0SGBDR0QMG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-0SGBDR0QMG');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <CartProvider>
          <AppProvider currentTier={currentTier}>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <FloatingToolsButton />
          </AppProvider>
        </CartProvider>
      </body>
    </html>
  );
}
