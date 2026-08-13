import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — NINOC Store',
  description: 'Privacy Policy for NINOC Store (ninoc.store). Learn how we collect, use, and protect your personal data.',
  openGraph: {
    title: 'Privacy Policy — NINOC Store',
    description: 'Privacy Policy for NINOC Store. Learn how we collect, use, and protect your personal data.',
    url: 'https://ninoc.store/privacy-policy',
    type: 'website',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#111111] text-[#E5E5E5] font-sans selection:bg-rose selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 md:px-16 py-8 md:py-12">
        <div className="max-w-[900px] mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/50 hover:text-rose transition-colors text-xs font-mono uppercase tracking-widest mb-6"
          >
            ← Back to Store
          </Link>
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-rose uppercase tracking-[0.3em]">
              Legal Document // ninoc.store
            </p>
            <h1 className="text-3xl md:text-4xl font-display font-medium italic tracking-tighter text-white uppercase leading-none">
              Privacy Policy
            </h1>
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Last Updated: July 2026 &mdash; Effective Immediately
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 md:px-16 py-12 md:py-16">
        <div className="max-w-[900px] mx-auto space-y-10">

          {/* Introduction */}
          <section className="space-y-3">
            <p className="text-sm leading-relaxed text-white/80">
              NINOC Enterprise (&quot;NINOC&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website{' '}
              <strong className="text-white">ninoc.store</strong> and associated services including the{' '}
              <strong className="text-white">NINOC MESSAGE</strong> WhatsApp Business notification system.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information
              when you interact with our platform.
            </p>
            <p className="text-sm leading-relaxed text-white/80">
              By using our services, you consent to the data practices described in this policy. This policy
              complies with Indonesia&apos;s Personal Data Protection Law (UU Pelindungan Data Pribadi / UU PDP)
              and applicable international data protection standards.
            </p>
          </section>

          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-rose tabular-nums">[01]</span>
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                Information We Collect
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-white/75 pl-8">
              <p>We collect the following categories of personal data:</p>
              <ul className="list-disc list-inside space-y-1.5 marker:text-rose">
                <li><strong className="text-white/90">Identity Data:</strong> Full name as provided during checkout.</li>
                <li><strong className="text-white/90">Contact Data:</strong> Email address, phone number (including WhatsApp number).</li>
                <li><strong className="text-white/90">Delivery Data:</strong> Shipping address, postal code, city, and province.</li>
                <li><strong className="text-white/90">Transaction Data:</strong> Order details, payment method selection, order status, and shipping tracking numbers.</li>
                <li><strong className="text-white/90">Technical Data:</strong> Browser type, device type, and anonymized analytics data collected through standard web analytics.</li>
              </ul>
              <p>
                We do <strong className="text-white">NOT</strong> collect sensitive personal data such as government ID numbers,
                biometric data, religious beliefs, or health information.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-rose tabular-nums">[02]</span>
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                How We Use Your Data
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-white/75 pl-8">
              <p>Your personal data is used strictly for the following purposes:</p>
              <ul className="list-disc list-inside space-y-1.5 marker:text-rose">
                <li><strong className="text-white/90">Order Fulfillment:</strong> Processing, confirming, and delivering your purchases.</li>
                <li><strong className="text-white/90">Payment Processing:</strong> Verifying transactions through our payment gateway partner (Midtrans).</li>
                <li><strong className="text-white/90">Shipping &amp; Logistics:</strong> Generating shipping labels, calculating courier rates, and tracking deliveries through our logistics partner (Biteship).</li>
                <li><strong className="text-white/90">Transactional Notifications:</strong> Sending order confirmations, payment receipts, shipping updates, delivery confirmations, and return/refund status updates via WhatsApp (through Meta&apos;s WhatsApp Business Cloud API) and email.</li>
                <li><strong className="text-white/90">Promotional Communications:</strong> Sending marketing messages and promotions <strong className="text-white">only to customers who have explicitly opted in</strong> to receive such communications via WhatsApp.</li>
                <li><strong className="text-white/90">Customer Support:</strong> Responding to inquiries, complaints, and return/refund requests.</li>
              </ul>
              <p>
                We do <strong className="text-white">NOT</strong> use your data for profiling, automated decision-making,
                or any purpose beyond those listed above.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-rose tabular-nums">[03]</span>
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                Third-Party Data Sharing
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-white/75 pl-8">
              <p>
                We share your data <strong className="text-white">only with essential service partners</strong> required
                to fulfill your orders. We <strong className="text-white">NEVER sell, rent, or monetize</strong> customer data.
              </p>
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-[#181818] border border-white/10 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Meta Platforms / WhatsApp Business Cloud API</h3>
                  <p className="text-xs text-white/60">
                    Customer phone numbers are shared with Meta&apos;s WhatsApp Business API to deliver transactional notifications
                    (invoices, shipping updates, delivery confirmations) and opt-in promotional broadcasts. Messages are sent
                    using pre-approved WhatsApp message templates. No message content is stored beyond Meta&apos;s standard retention policies.
                  </p>
                </div>
                <div className="p-4 bg-[#181818] border border-white/10 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Midtrans (Payment Gateway)</h3>
                  <p className="text-xs text-white/60">
                    Transaction details are processed through Midtrans for secure payment processing. Midtrans is PCI-DSS certified.
                    NINOC does not store credit card numbers or banking credentials on our servers.
                  </p>
                </div>
                <div className="p-4 bg-[#181818] border border-white/10 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Biteship (Logistics Partner)</h3>
                  <p className="text-xs text-white/60">
                    Customer shipping addresses and phone numbers are shared with Biteship to calculate courier rates,
                    create shipping orders, and enable real-time delivery tracking.
                  </p>
                </div>
                <div className="p-4 bg-[#181818] border border-white/10 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Supabase (Cloud Database)</h3>
                  <p className="text-xs text-white/60">
                    Customer and order data is securely stored in our Supabase-hosted PostgreSQL database with
                    Row Level Security (RLS) policies enforced. Data is encrypted at rest and in transit.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-rose tabular-nums">[04]</span>
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                Data Retention
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-white/75 pl-8">
              <p>
                We retain your personal data only for as long as necessary to fulfill the purposes outlined
                in this policy, comply with legal obligations, resolve disputes, and enforce agreements.
              </p>
              <ul className="list-disc list-inside space-y-1.5 marker:text-rose">
                <li><strong className="text-white/90">Order Data:</strong> Retained for 3 years after the transaction date for warranty and legal compliance purposes.</li>
                <li><strong className="text-white/90">WhatsApp Message Logs:</strong> Message delivery status is retained for operational monitoring. Message content is not stored on our servers beyond delivery confirmation.</li>
                <li><strong className="text-white/90">Marketing Consent:</strong> Retained until the customer opts out or requests deletion.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-rose tabular-nums">[05]</span>
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                Security Measures
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-white/75 pl-8">
              <ul className="list-disc list-inside space-y-1.5 marker:text-rose">
                <li>All web traffic is encrypted via HTTPS/TLS.</li>
                <li>Payment transactions are processed through PCI-DSS certified infrastructure (Midtrans).</li>
                <li>Database access is protected by Row Level Security (RLS) policies and service-role authentication.</li>
                <li>API keys and secrets are stored as encrypted environment variables, never in client-side code.</li>
                <li>WhatsApp messages are sent through Meta&apos;s official Cloud API with token-based authentication.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-rose tabular-nums">[06]</span>
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                Your Rights
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-white/75 pl-8">
              <p>Under applicable data protection laws (including UU PDP), you have the right to:</p>
              <ul className="list-disc list-inside space-y-1.5 marker:text-rose">
                <li><strong className="text-white/90">Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong className="text-white/90">Rectification:</strong> Request correction of inaccurate personal data.</li>
                <li><strong className="text-white/90">Erasure:</strong> Request permanent deletion of your personal data from our systems.</li>
                <li><strong className="text-white/90">Opt-Out:</strong> Withdraw consent for promotional communications at any time by replying &quot;STOP&quot; to any WhatsApp message or contacting us directly.</li>
                <li><strong className="text-white/90">Portability:</strong> Request your data in a machine-readable format.</li>
              </ul>
              <p>
                To exercise any of these rights, contact us using the information provided below.
                We will respond to your request within 14 business days.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-rose tabular-nums">[07]</span>
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                Cookies &amp; Tracking
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-white/75 pl-8">
              <p>
                Our website uses essential cookies for shopping cart functionality and session management.
                We may use anonymized analytics to understand general usage patterns.
                We do not use third-party advertising trackers or sell cookie data.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-rose tabular-nums">[08]</span>
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                Changes to This Policy
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-white/75 pl-8">
              <p>
                We may update this Privacy Policy periodically. Changes will be posted on this page with an updated
                &quot;Last Updated&quot; date. Continued use of our services after changes constitutes acceptance
                of the revised policy.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-rose tabular-nums">[09]</span>
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-wider">
                Contact Us
              </h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-white/75 pl-8">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal data,
                please contact us:
              </p>
              <div className="p-4 bg-[#181818] border border-white/10 space-y-1.5">
                <p className="text-xs font-mono text-white/90"><strong>NINOC Enterprise</strong></p>
                <p className="text-xs font-mono text-white/60">Email: ninocenterprise@gmail.com</p>
                <p className="text-xs font-mono text-white/60">WhatsApp: +62 821-1983-774</p>
                <p className="text-xs font-mono text-white/60">Address: Griya Saluyu, Bandung 40292, West Java, Indonesia</p>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 md:px-16 py-6">
        <div className="max-w-[900px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            © {new Date().getFullYear()} NINOC Enterprise. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/legal" className="text-[10px] font-mono text-white/30 hover:text-rose transition-colors uppercase tracking-widest">
              Terms &amp; Conditions
            </Link>
            <span className="text-white/15">|</span>
            <Link href="/" className="text-[10px] font-mono text-white/30 hover:text-rose transition-colors uppercase tracking-widest">
              Store
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
