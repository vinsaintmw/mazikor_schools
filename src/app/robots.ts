import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        disallow: [
          "/dashboard",
          "/admin",
          "/students",
          "/teachers",
          "/staff",
          "/parents",
          "/classes",
          "/subjects",
          "/attendance",
          "/exams",
          "/results",
          "/report-cards",
          "/timetable",
          "/assignments",
          "/fees",
          "/invoices",
          "/payments",
          "/expenses",
          "/finance",
          "/notices",
          "/events",
          "/library",
          "/transport",
          "/inventory",
          "/hr",
          "/reports",
          "/settings",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
