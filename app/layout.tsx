import type { Metadata } from "next";
import "./globals.css";
import "./polish.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://builders.rakibhq.xyz"),
  title: "BaseDashboard",
  description: "An analytics dashboard for builders on Base. Understand wallets, transactions, and product activity across your applications.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "BaseDashboard",
    title: "BaseDashboard",
    description: "Analytics for builders on Base. Wallets, transactions, and product insights.",
    images: [{
      url: "/social/base-dashboard-v1.png",
      secureUrl: "https://builders.rakibhq.xyz/social/base-dashboard-v1.png",
      type: "image/png",
      width: 1730,
      height: 909,
      alt: "BaseDashboard. Analytics for builders on Base. Wallets, transactions, and product insights.",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BaseDashboard",
    description: "Analytics for builders on Base. Wallets, transactions, and product insights.",
    images: [{
      url: "/social/base-dashboard-v1.png",
      alt: "BaseDashboard. Analytics for builders on Base. Wallets, transactions, and product insights.",
    }],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="theme-color" content="#244e40" /></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
