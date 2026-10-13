import type { Metadata } from "next";
import "./globals.css";
import "./polish.css";

export const metadata: Metadata = {
  title: "Orbit Analytics",
  description: "A clearer view of your ecosystem. Wallets, transactions, and product analytics across all your mini apps.",
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
