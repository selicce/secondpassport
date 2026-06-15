import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JR & Firm Client Portal",
    template: "%s · JR & Firm",
  },
  description:
    "Secure client portal for JR & Firm — company formation, corporate structuring, banking coordination, immigration and cross-border market entry.",
  robots: { index: false, follow: false }, // private portal
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Progressive font enhancement: Inter + Playfair Display when online,
          system-ui / Georgia fallbacks otherwise (see --font-sans/--font-serif
          in globals.css). Avoids a hard network dependency at build time.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
