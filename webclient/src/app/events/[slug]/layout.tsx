import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";

const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://eventos.example.com";

const SITE_URL = RAW_SITE_URL.startsWith("http")
  ? RAW_SITE_URL
  : `https://${RAW_SITE_URL}`;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const response = await fetch(`${API_URL}/events/slug/${slug}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        title: `Event nicht gefunden | ${BRAND_NAME}`,
        robots: { index: false, follow: false },
      };
    }

    const event = await response.json();
    const url = `${SITE_URL}/events/${event.slug || slug}`;
    const description =
      (event.description && String(event.description).trim()) ||
      "Schaue dir dieses Event an!";

    const descriptionShort =
      description.length > 180 ? `${description.slice(0, 177)}...` : description;

    const bannerUrl = event.banner
      ? event.banner.startsWith("http")
        ? event.banner
        : `${SITE_URL}${event.banner.startsWith("/") ? "" : "/"}${event.banner}`
      : null;

    const images = bannerUrl
      ? [
          {
            url: bannerUrl,
            width: 1200,
            height: 630,
            alt: event.name,
          },
        ]
      : [];

    return {
      metadataBase: new URL(SITE_URL),
      title: `${event.name} | ${BRAND_NAME}`,
      description: descriptionShort,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: event.name,
        description: descriptionShort,
        url,
        siteName: BRAND_NAME,
        type: "website",
        images,
      },
      twitter: {
        card: images.length > 0 ? "summary_large_image" : "summary",
        title: event.name,
        description: descriptionShort,
        images: images.map((image) => image.url),
      },
    };
  } catch {
    return {
      title: `Event | ${BRAND_NAME}`,
    };
  }
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
