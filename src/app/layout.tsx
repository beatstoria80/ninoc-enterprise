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
import GlobalDragScroll from "@/components/GlobalDragScroll";
import MetaPixel from "@/components/MetaPixel";

const inter = {
  variable: "--font-sans",
};

// Using fallback font for display to avoid Turbopack build errors with Google Fonts
// (Inter is still loaded via next/font/google)
const poppins = {
  variable: "--font-display",
};

let rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('supabase') 
  ? process.env.NEXT_PUBLIC_APP_URL 
  : 'https://ninoc.store';
if (!rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://')) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const BASE_URL = rawBaseUrl;
export async function generateMetadata(): Promise<Metadata> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const locale = headersList.get('x-next-locale') || 'id';
  const isEn = locale === 'EN';

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: isEn 
        ? 'NINOC — Independent Archival Garment Studio & Lifestyle Brand' 
        : 'NINOC — Studio Garment & Brand Lifestyle Independen Indonesia',
      template: '%s | NINOC STORE',
    },
    description: isEn 
      ? 'NINOC is an independent archival garment studio and emerging lifestyle brand from Bandung, Indonesia. Specializing in minimalist urban streetwear, artisan objects, and specialty pantry.'
      : 'NINOC adalah studio garment arsip independen dan brand lifestyle dari Bandung, Indonesia. Mengkurasi streetwear urban minimalis, objek artisan, dan pantry spesialti.',
    keywords: [
      'independent lifestyle brands from indonesia',
      'emerging indonesian apparel brands',
      'minimalist urban fashion',
      'indonesian design studio',
      'archival garment studio bandung',
      'contemporary streetwear indonesia',
      'bandung urban apparel',
      'sustainable craft streetwear',
      'ninoc design studio',
      'apparel premium indonesia',
      'specialty coffee bandung',
      'homeware artisan bandung',
      'ceramics bandung',
      'brand lokal indonesia',
      'objects consumer goods'
    ],
    authors: [{ name: 'NINOC Studio' }],
    creator: 'NINOC Studio',
    publisher: 'NINOC Studio',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/logo.png', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
      apple: '/logo.png',
    },
    openGraph: {
      type: 'website',
      locale: isEn ? 'en_US' : 'id_ID',
      url: BASE_URL,
      siteName: 'NINOC STORE',
      title: isEn ? 'NINOC — Independent Archival Garment Studio & Lifestyle Brand' : 'NINOC — Studio Garment & Brand Lifestyle Independen Indonesia',
      description: isEn
        ? 'Independent archival garment studio and contemporary lifestyle brand from Bandung, Indonesia. Curating minimalist urban fashion, artisan objects, and specialty pantry.'
        : 'Studio garment arsip independen dan brand lifestyle dari Bandung, Indonesia. Mengkurasi streetwear urban minimalis, objek artisan, dan pantry spesialti.',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'NINOC — Independent Archival Garment Studio & Lifestyle Brand',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isEn ? 'NINOC — Independent Archival Garment Studio & Lifestyle Brand' : 'NINOC — Studio Garment & Brand Lifestyle Independen Indonesia',
      description: isEn
        ? 'Independent archival garment studio and emerging lifestyle brand from Bandung, Indonesia.'
        : 'Studio garment arsip independen dan brand lifestyle dari Bandung, Indonesia.',
      images: ['/og-image.png'],
      creator: '@ninocstore',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    appLinks: {
      web: {
        url: BASE_URL,
        should_fallback: true,
      },
    },
    alternates: {
      languages: {
        'id-ID': BASE_URL,
        'en-US': `${BASE_URL}/en`,
        'x-default': BASE_URL,
      },
    },
    verification: {
      google: 'So4rS9Ld3dPQAhPV2Jh0AUPpPQnwiLoxQkj5gM2JlIM',
      other: {
        'facebook-domain-verification': 'mdawcs7lo6md33d800mlxjv6t62aq0',
      },
    },
    manifest: '/manifest.json',
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
        {/* Global gtag stub: ensures window.gtag queues events before async script loads */}
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','AW-18363665188');` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111111" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- loaded via <link> for Turbopack compatibility, next/font/google causes build issues */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;700;900&display=swap" rel="stylesheet" />
        {/* Structured Data — Organization, Brand, & Design Studio Entity */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['Organization', 'Brand', 'ClothingStore'],
              name: 'NINOC',
              alternateName: ['NINOC Enterprise', 'NINOC STORE', 'NINOC Design & Garment Studio'],
              url: BASE_URL,
              logo: `${BASE_URL}/logo.png`,
              image: `${BASE_URL}/og-image.png`,
              slogan: 'Well-Made Things, Chosen Well — Independent Archival Garment & Lifestyle Studio',
              description: 'NINOC is an independent archival garment studio and contemporary lifestyle brand based in Bandung, Indonesia. Specializing in minimalist urban streetwear, heavyweight combed cotton apparel, artisan lifestyle objects, and specialty pantry.',
              foundingDate: '2024',
              foundingLocation: {
                '@type': 'Place',
                name: 'Bandung, West Java, Indonesia',
              },
              knowsAbout: [
                'Independent Indonesian Apparel Brands',
                'Minimalist Urban Fashion',
                'Archival Garment Studio & Streetwear',
                'Contemporary Indonesian Design Studios',
                'Bandung Subculture & Garment Architecture',
                'Artisan Lifestyle Objects & Stoneware',
                'Indonesian Specialty Coffee & Pantry'
              ],
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'NINOC Curated Collections',
                itemListElement: [
                  {
                    '@type': 'OfferCatalog',
                    name: 'Apparel — Archival Urban Streetwear',
                    url: `${BASE_URL}/shop?filter=Apparel`
                  },
                  {
                    '@type': 'OfferCatalog',
                    name: 'Objects — Artisan Homeware & Lifestyle Goods',
                    url: `${BASE_URL}/shop?filter=Objects`
                  },
                  {
                    '@type': 'OfferCatalog',
                    name: 'Pantry — Specialty Coffee & Culinary Provisions',
                    url: `${BASE_URL}/shop?filter=Pantry`
                  }
                ]
              },
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya RANCASARI',
                addressLocality: 'Bandung',
                addressRegion: 'Jawa Barat',
                postalCode: '40292',
                addressCountry: 'ID',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+628211983774',
                contactType: 'customer service',
                areaServed: ['ID', 'SG', 'MY', 'US', 'AU', 'Worldwide'],
                availableLanguage: ['Indonesian', 'English'],
              },
              sameAs: [
                'https://www.instagram.com/ninoc.co',
                'https://tiktok.co.id/ninocenterprise',
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
              description: 'Official flagship retail and online store for NINOC independent apparel, objects, and specialty pantry.',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya RANCASARI',
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
              description: 'Multidimensional Creative House & Lifestyle Ecosystem (Apparel, Objects, Pantry)',
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
      <body className="min-h-full flex flex-col minimal-scroll" suppressHydrationWarning>
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <GoogleAnalytics gaId="AW-18363665188" />
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
          <GlobalDragScroll />
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
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
