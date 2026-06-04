import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import ClientPlatformManager from "@/components/ClientPlatformManager";
import BrandProvider from "@/components/BrandProvider";
import SupportChat from "@/components/SupportChat";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import SecurityEnforcer from "@/components/SecurityEnforcer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.id';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'NINOC — Premium Archival Garment Studio',
    template: '%s | NINOC STORE',
  },
  description: 'NINOC adalah brand garment archival studio Indonesia yang menghadirkan koleksi apparel premium dengan desain industrial minimalist. Shop now!',
  keywords: ['garment archival', 'apparel premium', 'industrial minimalist', 'fashion bandung', 'distro bandung', 'brand lokal Indonesia', 'premium clothing'],
  authors: [{ name: 'NINOC STORE' }],
  creator: 'NINOC STORE',
  publisher: 'NINOC STORE',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: BASE_URL,
    siteName: 'NINOC STORE',
    title: 'NINOC — Premium Archival Garment Studio',
    description: 'NINOC adalah brand garment archival studio Indonesia yang menghadirkan koleksi apparel premium dengan desain industrial minimalist.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NINOC STORE — Premium Archival Garment Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NINOC — Premium Archival Garment Studio',
    description: 'NINOC adalah brand garment archival studio Indonesia yang menghadirkan koleksi apparel premium.',
    images: ['/og-image.png'],
    creator: '@ninocstore',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    google: 'your-google-site-verification-code', // ← replace with actual verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        {/* Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'NINOC STORE',
              url: BASE_URL,
              logo: `${BASE_URL}/logo.png`,
              description: 'Premium Archival Garment Studio dari Indonesia',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Jl. Gudang Selatan No. 22',
                addressLocality: 'Bandung',
                addressRegion: 'Jawa Barat',
                postalCode: '40113',
                addressCountry: 'ID',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+62-812-0000-0000',
                contactType: 'customer service',
                availableLanguage: ['Indonesian', 'English'],
              },
              sameAs: [
                'https://instagram.com/ninocstore',
                'https://twitter.com/ninocstore',
              ],
            }),
          }}
        />
        {/* Structured Data — Store */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: 'NINOC STORE',
              image: `${BASE_URL}/og-image.png`,
              url: BASE_URL,
              priceRange: '$$',
              servesCuisine: 'Fashion',
              acceptReservation: false,
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col minimal-scroll" style={{ overflowX: 'clip' }}>
        <SmoothScrollProvider>
          <Script
            src={
              process.env.MIDTRANS_IS_PRODUCTION === 'true'
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js'
            }
            data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
            strategy="afterInteractive"
          />
          <SecurityEnforcer />
          <ClientPlatformManager>
            <BrandProvider>
              {children}
            </BrandProvider>
          </ClientPlatformManager>
          <div className="print:hidden">
            <SupportChat />
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
