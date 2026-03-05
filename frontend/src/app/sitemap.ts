import type { MetadataRoute } from "next";

/**
 * Base URL for sitemap. Vercel sets VERCEL_URL automatically.
 * Set NEXT_PUBLIC_SITE_URL for custom domains (e.g. https://execconnect.com).
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://exec-connect.vercel.app";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const routes: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Key marketing / product pages
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/who-we-help`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/why-exec-connect`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cxos`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/case-studies`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ecosystem`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-founders`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-institutions`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-enterprises`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/for-partners`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Supporting pages
    {
      url: `${baseUrl}/about`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/get-started`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/book-call`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/book-diagnostic`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/governance`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Legal
    {
      url: `${baseUrl}/terms`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return routes;
}
