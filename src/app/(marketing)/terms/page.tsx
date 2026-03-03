import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - From Your Agent",
  description: "Terms of Service for the From Your Agent platform.",
};

export default function TermsPage() {
  return (
    <div className="bg-[#FFF5EE] py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-serif text-4xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: February 15, 2026</p>

        <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">1. Agreement to Terms</h2>
            <p className="mt-2">
              By accessing or using the From Your Agent platform (&quot;Service&quot;), operated by From Your Agent LLC
              (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">2. Description of Service</h2>
            <p className="mt-2">
              From Your Agent is a relationship marketing platform for real estate agents. The Service allows
              agents to upload contact databases, preview and send personalized postcards featuring curated
              local merchant offers, and manage monthly mailing campaigns. Postcards are printed and mailed
              through our third-party printing partner (Lob) via USPS First-Class Mail.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">3. Account Registration</h2>
            <p className="mt-2">
              To use the Service, you must create an account and provide accurate, complete information.
              You are responsible for maintaining the confidentiality of your account credentials and for
              all activity that occurs under your account. You must notify us immediately of any unauthorized
              use of your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">4. Billing and Payment</h2>
            <div className="mt-2 space-y-2">
              <p>
                The Service uses a pay-per-card pricing model with no monthly fees, setup fees, or minimums.
                You are billed based on the number of postcards mailed each campaign cycle. Current pricing
                tiers are listed on our Pricing page and are subject to change with notice.
              </p>
              <p>
                By adding a payment method, you authorize us to charge your card for postcards mailed on
                your behalf. Invoices are created after each campaign is sent. All payments are processed
                through Stripe and are non-refundable once postcards have been submitted for printing and mailing.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">5. Contact Data</h2>
            <div className="mt-2 space-y-2">
              <p>
                You are solely responsible for the contact data you upload to the Service, including
                ensuring you have the right to use the names, addresses, and other personal information
                of your contacts for direct mail marketing purposes.
              </p>
              <p>
                We use CASS-certified address verification to standardize and validate mailing addresses.
                We do not sell, share, or use your contact data for any purpose other than providing the Service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">6. Postcard Content</h2>
            <p className="mt-2">
              Postcards include curated local merchant offers on the front and your personalized branding
              (headshot, logo, name, brokerage, and custom message) on the back. You are responsible for
              ensuring your branding content complies with your brokerage&apos;s guidelines and applicable
              real estate advertising regulations.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">7. Acceptable Use</h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Upload false, misleading, or fraudulent contact information</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Reverse engineer or attempt to extract the source code of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">8. Service Availability</h2>
            <p className="mt-2">
              We strive to maintain reliable service but do not guarantee uninterrupted availability.
              We may modify, suspend, or discontinue any part of the Service at any time. We are not liable
              for any delays or failures in postcard delivery caused by our printing partner, USPS, or other
              circumstances beyond our control.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">9. Limitation of Liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, From Your Agent LLC shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including loss of profits,
              data, or business opportunities, arising out of or related to your use of the Service. Our
              total liability shall not exceed the amount you paid to us in the twelve (12) months preceding
              the claim.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">10. Termination</h2>
            <p className="mt-2">
              You may cancel your account at any time. We may suspend or terminate your account if you
              violate these terms. Upon termination, your right to use the Service ceases immediately.
              Any pending campaigns that have already been submitted for printing will still be mailed
              and billed.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">11. Changes to Terms</h2>
            <p className="mt-2">
              We may update these Terms of Service from time to time. We will notify you of material
              changes by posting the updated terms on this page with a revised &quot;Last updated&quot; date.
              Your continued use of the Service after changes are posted constitutes acceptance of the
              revised terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">12. Governing Law</h2>
            <p className="mt-2">
              These terms shall be governed by and construed in accordance with the laws of the State
              of New Mexico, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">13. Contact Us</h2>
            <p className="mt-2">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:support@from-your-agent.com" className="text-[#E8733A] hover:underline">
                support@from-your-agent.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
