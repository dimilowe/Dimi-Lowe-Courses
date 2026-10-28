import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { CartProvider } from "@/contexts/CartContext";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import SiteFooter from "@/components/SiteFooter";
import { FeedbackLauncherButton } from "@/components/FeedbackLauncherButton";
import { getSiteUrl } from "@/lib/site-url";
import { ClerkAuthProvider } from "@/components/providers/clerk-auth-provider";
import { headers } from "next/headers";
import { publishableKeyFromHost } from "@clerk/shared/keys";

const inter = Inter({ subsets: ["latin"] });
const SUNSET_MODE = false;

export const metadata: Metadata = {
  title: "VCM Suite - Creator Store",
  description: "Subscriptions, courses, apps, downloads, freebies, and more from VCM Suite.",
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VCM Suite - Creator Store",
    description: "Subscriptions, courses, apps, downloads, freebies, and more from VCM Suite.",
    url: "/",
    siteName: "VCM Suite",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const host = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "")
    .split(",")[0].trim();
  const clerkPubKey = publishableKeyFromHost(host, process.env.CLERK_PUBLISHABLE_KEY);

  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-73GV8CDN6Z"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-73GV8CDN6Z');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ClerkAuthProvider
          publishableKey={clerkPubKey}
          proxyUrl={process.env.CLERK_PROXY_URL}
        >
          {SUNSET_MODE ? (
            <main className="min-h-screen">{children}</main>
          ) : (
            <CartProvider>
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-1">
                    {children}
                  </main>
                  <SiteFooter />
                </div>
                <FeedbackLauncherButton />
                <FeedbackDialog hideTrigger />
            </CartProvider>
          )}
        </ClerkAuthProvider>
      </body>
    </html>
  );
}
