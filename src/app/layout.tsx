import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Script from "next/script";
import ExitIntentPopup from "@/components/ExitIntentPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Giannis Notaras - Mental Performance Expert & Author",
    template: "%s | Giannis Notaras"
  },
  description: "Performance expert helping athletes, executives, and students overcome mental hurdles. Author of 7 books on mental toughness, confidence, and peak performance.",
  keywords: ["mental performance", "sports psychology", "mental toughness", "peak performance", "confidence building", "athlete mindset", "performance coaching", "Giannis Notaras"],
  authors: [{ name: "Giannis Notaras" }],
  creator: "Giannis Notaras",
  publisher: "Giannis Notaras",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thementalsport.com",
    siteName: "Giannis Notaras - Mental Performance Expert",
    title: "Giannis Notaras - Mental Performance Expert & Author",
    description: "Performance expert helping athletes, executives, and students overcome mental hurdles. Author of 7 books on mental toughness, confidence, and peak performance.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Giannis Notaras - Mental Performance Expert"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Giannis Notaras - Mental Performance Expert & Author",
    description: "Performance expert helping athletes, executives, and students overcome mental hurdles.",
    images: ["/og-image.png"],
    creator: "@giannisnotaras"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-1BMW0D4K52"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-1BMW0D4K52');
          `}
        </Script>
        <Navbar />
        {children}
        <ExitIntentPopup />
      </body>
    </html>
  );
}
