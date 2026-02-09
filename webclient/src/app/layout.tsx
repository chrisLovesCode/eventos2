import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: `${BRAND_NAME} - Event Management Plattform`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: "Moderne Event Management Plattform entwickelt mit Next.js und NestJS",
  keywords: ["events", "veranstaltungen", "management", "nextjs", "nestjs"],
  authors: [{ name: `${BRAND_NAME} Team` }],
  creator: BRAND_NAME,
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://eventos2.example.com",
    title: `${BRAND_NAME} - Event Management Plattform`,
    description: "Moderne Event Management Plattform",
    siteName: BRAND_NAME,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
