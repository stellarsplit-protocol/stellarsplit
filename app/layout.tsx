import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "StellarSplit — Decentralized Bill Splitting on Stellar",
  description:
    "Split bills and group payments trustlessly on the Stellar network using Soroban smart contracts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="min-h-screen bg-[#0d0f1a] text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
