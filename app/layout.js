import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Diverse Diaries",
  description:
    "Explore insightful stories and engaging essays at Diverse Diaries, where creative voices share unique experiences and inspire deeper understanding.",
  openGraph: {
    title: "Diverse Diaries",
    description:
      "Explore insightful stories and engaging essays at Diverse Diaries, where creative voices share unique experiences and inspire deeper understanding.",
    url: "https://diversediaries.com",
    type: "website",
    images: [
      {
        url: "https://diversediaries.com/images/hero.png",
        width: 1200,
        height: 630,
        alt: "Descriptive alt text",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diverse Diaries",
    description:
      "Explore insightful stories and engaging essays at Diverse Diaries, where creative voices share unique experiences and inspire deeper understanding.",
    image: "https://diversediaries.com/images/hero.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
