import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/contexts/CartContext";
import FloatingToolsButton from "@/components/FloatingToolsButton";
import { AppProvider } from "@/components/providers/AppProvider";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"] });
const SUNSET_MODE = true;

export const metadata: Metadata = {
  title: "VCM Suite - Free Tools & Resources for Creators",
  description: "Free tools and resources to help creators grow, engage, and monetize their creative business.",
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VCM Suite - Free Tools & Resources for Creators",
    description: "Free tools and resources to help creators grow, engage, and monetize their creative business.",
    url: "/",
    siteName: "VCM Suite",
    type: "website",
  },
  verification: {
    google: '5cb76b900fd3341c',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {!SUNSET_MODE && (
          <>
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
            <Script id="ops-page-view" strategy="afterInteractive">
              {`
                (function () {
                  try {
                    var referrer = document.referrer || "";
                    var isOrganic = /(google\\.|bing\\.|yahoo\\.|duckduckgo\\.|ecosia\\.|baidu\\.|yandex\\.)/i.test(referrer);
                    fetch("/api/analytics/track", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        event: "page_view",
                        properties: {
                          path: window.location.pathname,
                          referrer: referrer,
                          isOrganic: isOrganic
                        }
                      }),
                      keepalive: true
                    }).catch(function () {});
                  } catch (e) {}
                })();
              `}
            </Script>
          </>
        )}
      </head>
      <body className={inter.className}>
        {SUNSET_MODE ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <CartProvider>
            <AppProvider>
              <Navbar />
              <main className="min-h-screen">
                {children}
              </main>
              <FeedbackDialog hideTrigger />
              <FloatingToolsButton />
            </AppProvider>
          </CartProvider>
        )}
      </body>
    </html>
  );
}
