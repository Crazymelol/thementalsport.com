import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mina",
  description: "A voice-first AI agent.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* System font stack — no web-font fetch, so it works fully offline. */}
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
