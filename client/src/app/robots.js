export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account/", "/cart/", "/checkout/", "/login", "/register", "/auth"],
      },
    ],
    sitemap: "https://nutrybites.co.in/sitemap.xml",
  };
}
