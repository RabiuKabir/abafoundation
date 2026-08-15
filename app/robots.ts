import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The admin is already gated server-side; this just keeps crawlers
        // from wasting time on URLs that will only redirect them to /login.
        disallow: [
          "/api/",
          "/dashboard",
          "/activities",
          "/approvals",
          "/donations",
          "/reports",
          "/messages",
          "/users",
          "/audit",
          "/settings",
          "/login",
          "/change-password",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
