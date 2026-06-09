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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ninoc.store';

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
          <ClientPlatformManager>
            <BrandProvider>
              <main id="main-content">
                {children}
              </main>
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
