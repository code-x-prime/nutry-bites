import { Lato, Jost } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { RouteGuard } from "@/components/route-guard";
import { ClientOnly } from "@/components/client-only";
import { ScrollToTop } from "@/components/ScrollToTop";
import TawkToWidget from "@/components/TawkToWidget";

/* ── Body font: Lato ── */
const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

/* ── Display / UI font: Jost ── */
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Nutry Bites — Healthy Snacks Anytime, Anywhere",
    template: "%s | Nutry Bites",
  },
  description:
    "Discover Nutry Bites, your destination for premium roasted Makhana (fox nuts) and healthy snacks. Crunchy, light, and wholesome goodness delivered to your door.",
  keywords: ["roasted makhana", "healthy snacks", "fox nuts", "oil-free snacks", "nutry bites", "diet snacks", "indian snacks"],
  authors: [{ name: "Nutry Bites" }],
  creator: "Nutry Bites",
  publisher: "Nutry Bites",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://nutrybites.co.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nutry Bites — Healthy Snacks Anytime, Anywhere",
    description: "Discover Nutry Bites, your destination for premium roasted Makhana (fox nuts) and healthy snacks.",
    url: "https://nutrybites.co.in",
    siteName: "Nutry Bites",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nutry Bites — Healthy Snacks Anytime, Anywhere",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nutry Bites — Healthy Snacks Anytime, Anywhere",
    description: "Premium roasted Makhana and healthy snacks.",
    creator: "@nutrybites",
    images: ["/og-image.png"],
  },
  verification: {
    google: "kSD3cECTpb-8xGj_SuDQEHWLUVE_nGhVYL5ncVln_GQ",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} ${jost.variable} font-lato antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                <ClientOnly>
                  <RouteGuard>{children}</RouteGuard>
                </ClientOnly>
              </main>
              <Footer />
            </div>
            <Toaster position="top-center" richColors closeButton />
            <TawkToWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}