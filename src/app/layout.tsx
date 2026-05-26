import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import ClientPlatformManager from "@/components/ClientPlatformManager";
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

export const metadata: Metadata = {
  title: "NINOC | Pure Organic Art",
  description: "Wear the art, own the day. Premium artistic collections for the conscious mobility.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden minimal-scroll">
        <SmoothScrollProvider>
          <Script
            src={process.env.MIDTRANS_IS_PRODUCTION === 'true'
              ? "https://app.midtrans.com/snap/snap.js"
              : "https://app.sandbox.midtrans.com/snap/snap.js"}
            data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
            strategy="afterInteractive"
          />
          <SecurityEnforcer />
          <ClientPlatformManager>
            {children}
          </ClientPlatformManager>
          <SupportChat />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}