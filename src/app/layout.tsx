import type { Metadata } from "next";
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';

import "./globals.css";
import Script from "next/script";
import ClientPlatformManager from "@/components/ClientPlatformManager";
import BrandProvider from "@/components/BrandProvider";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import SecurityEnforcer from "@/components/SecurityEnforcer";
import { AffiliateTracker } from "@/components/AffiliateTracker";
import { Suspense } from "react";
import ClientOverlays from "@/components/ClientOverlays";
import PushNotificationManager from "@/components/PushNotificationManager";

const inter = {
  variable: "--font-sans",
};

// Using fallback font for display to avoid Turbopack build errors with Google Fonts
// (Inter is still loaded via next/font/google)
const poppins = {
  variable: "--font-display",
};

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') ? process.env.NEXT_PUBLIC_APP_URL : 'https://ninoc.store');

export async function generateMetadata(): Promise<Metadata> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const locale = headersList.get('x-next-locale') || 'id';
  const isEn = locale === 'EN';

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: isEn ? 'NINOC — Premium Archival Garment Studio' : 'NINOC — Premium Archival Garment Studio',
      template: '%s | NINOC STORE',
    },
    description: isEn 
      ? 'NINOC is an Indonesian archival garment studio presenting premium apparel collections with minimalist industrial design. Shop now!'
      : 'NINOC adalah brand garment archival studio Indonesia yang menghadirkan koleksi apparel premium dengan desain industrial minimalist. Shop now!',
    keywords: ['garment archival', 'apparel premium', 'industrial minimalist', 'fashion bandung', 'distro bandung', 'brand lokal Indonesia', 'premium clothing'],
    authors: [{ name: 'NINOC STORE' }],
    creator: 'NINOC STORE',
    publisher: 'NINOC STORE',
    openGraph: {
      type: 'website',
      locale: isEn ? 'en_US' : 'id_ID',
      url: BASE_URL,
      siteName: 'NINOC STORE',
      title: 'NINOC — Premium Archival Garment Studio',
      description: isEn
        ? 'NINOC is an Indonesian archival garment studio presenting premium apparel collections with minimalist industrial design.'
        : 'NINOC adalah brand garment archival studio Indonesia yang menghadirkan koleksi apparel premium dengan desain industrial minimalist.',
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
      description: isEn
        ? 'NINOC is an Indonesian archival garment studio presenting premium apparel collections.'
        : 'NINOC adalah brand garment archival studio Indonesia yang menghadirkan koleksi apparel premium.',
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
      languages: {
        'id': BASE_URL,
        'en': `${BASE_URL}/en`,
      },
    },
    verification: {
      google: 'So4rS9Ld3dPQAhPV2Jh0AUPpPQnwiLoxQkj5gM2JlIM',
    },
  };
}

import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const locale = headersList.get('x-next-locale') === 'EN' ? 'en' : 'id';

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111111" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- loaded via <link> for Turbopack compatibility, next/font/google causes build issues */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;700;900&display=swap" rel="stylesheet" />
        {/* Structured Data — Organization & Manufacturer */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['Organization', 'Manufacturer', 'Brand'],
              name: 'NINOC Enterprise',
              alternateName: 'NINOC STORE',
              url: BASE_URL,
              logo: `${BASE_URL}/logo.png`,
              description: 'NINOC Enterprise adalah produsen dan distributor garment pakaian bergaya industrial dan fungsional dari Bandung, Indonesia.',
              foundingDate: '2024',
              foundingLocation: {
                '@type': 'Place',
                name: 'Bandung, Indonesia'
              },
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya, Rancasari',
                addressLocality: 'Bandung',
                addressRegion: 'Jawa Barat',
                postalCode: '40292',
                addressCountry: 'ID',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+62-821-1983-774',
                contactType: 'customer service',
                areaServed: 'ID',
                availableLanguage: ['Indonesian', 'English'],
              },
              sameAs: [
                'https://instagram.com/ninoc.co',
                'https://twitter.com/ninocstore',
              ],
            }),
          }}
        />
        {/* Structured Data — Store & Distributor (LocalBusiness) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['ClothingStore', 'WholesaleStore'],
              name: 'NINOC STORE',
              image: `${BASE_URL}/og-image.png`,
              url: BASE_URL,
              priceRange: 'IDR',
              description: 'Distributor resmi dan toko ritel untuk produk apparel dan aksesoris fungsional NINOC.',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya, Rancasari',
                addressLocality: 'Bandung',
                addressRegion: 'Jawa Barat',
                postalCode: '40292',
                addressCountry: 'ID'
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: '-6.914744',
                longitude: '107.609810'
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                  opens: '09:00',
                  closes: '17:00'
                }
              ]
            }),
          }}
        />
        {/* Structured Data — WebSite with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'NINOC STORE',
              url: BASE_URL,
              description: 'Premium Archival Garment Studio dari Indonesia',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${BASE_URL}/shop?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {/* Structured Data — FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Bagaimana cara memesan di NINOC STORE?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Pilih produk yang diinginkan, pilih ukuran dan warna, tambahkan ke keranjang, lalu proceed ke checkout. Pembayaran dapat dilakukan melalui Midtrans (transfer bank, e-wallet, atau kartu kredit).',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Metode pembayaran apa saja yang tersedia?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'NINOC STORE menggunakan Midtrans untuk pembayaran. Metode yang tersedia meliputi transfer bank (BCA, Mandiri, BNI, BRI), e-wallet (GoPay, OVO, DANA), dan kartu kredit/debit (Visa, Mastercard).',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Berapa lama proses pengiriman?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Pengiriman dilakukan dalam 1-3 hari kerja setelah pembayaran terkonfirmasi. Kami menggunakan jasa pengiriman terpercaya untuk memastikan barang arrives dengan aman.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Bagaimana kebijakan retur di NINOC STORE?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Retur dapat dilakukan dalam 7 hari setelah barang diterima dengan kondisi belum digunakan dan label masih melekat. Hubungi tim kami melalui chat untuk proses retur.',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col minimal-scroll">
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
        {process.env.NEXT_PUBLIC_GTM_ID && <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />}
        {/* Skip to main content — Accessibility */}
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <script dangerouslySetInnerHTML={{ __html: `try{var m=window.matchMedia('(prefers-reduced-motion: reduce)');document.body.dataset.reducedMotion=m.matches?'true':'false';m.addEventListener('change',function(e){document.body.dataset.reducedMotion=e.matches?'true':'false'});}catch(e){}` }} />
        <SmoothScrollProvider>
          <Script
            src={
              process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
                ? 'https://app.midtrans.com/snap/snap.js'
                : 'https://app.sandbox.midtrans.com/snap/snap.js'
            }
            data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
            strategy="afterInteractive"
          />
          <SecurityEnforcer />
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>
          <ClientPlatformManager>
            <BrandProvider>
              <main id="main-content">
                {children}
              </main>
            </BrandProvider>
          </ClientPlatformManager>
          <ClientOverlays />
          <PushNotificationManager />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
