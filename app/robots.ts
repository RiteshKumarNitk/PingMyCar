import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api", "/v/", "/c/", "/vehicle/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
