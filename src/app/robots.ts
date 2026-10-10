import type { MetadataRoute } from "next";

// Event pages stay out of search results via noindex (meta + header). They are deliberately not
// disallowed here: crawlers have to be able to fetch a page to see its noindex, and link-preview
// bots need the page and its image.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] } };
}
