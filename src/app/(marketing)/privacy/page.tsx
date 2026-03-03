import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - From Your Agent",
  description: "Privacy Policy for the From Your Agent platform.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-[#FFF5EE] py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-serif text-4xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: February 15, 2026</p>

        <div className="mt-10 space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">1. Introduction</h2>
            <p className="mt-2">
              From Your Agent LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the From Your Agent
              platform (&quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">2. Information We Collect</h2>

            <h3 className="mt-4 font-semibold text-slate-800">Account Information</h3>
            <p className="mt-1">
              When you create an account, we collect your name, email address, phone number,
              brokerage name, real estate license information, and profile photo/logo.
            </p>

            <h3 className="mt-4 font-semibold text-slate-800">Contact Data You Upload</h3>
            <p className="mt-1">
              You may upload contact lists containing names, mailing addresses, and other information
              about your clients. This data is stored securely and used solely to fulfill your
              postcard mailing campaigns.
            </p>

            <h3 className="mt-4 font-semibold text-slate-800">Payment Information</h3>
            <p className="mt-1">
              Payment details (credit/debit card information) are collected and processed by our
              payment processor, Stripe. We do not store your full card number on our servers.
            </p>

            <h3 className="mt-4 font-semibold text-slate-800">Usage Information</h3>
            <p className="mt-1">
              We automatically collect information about how you interact with the Service,
              including pages visited, features used, and campaign activity.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">3. How We Use Your Information</h2>
            <p className="mt-2">We use the information we collect to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your postcard mailing campaigns</li>
              <li>Verify and standardize mailing addresses (CASS certification)</li>
              <li>Process payments and send billing notifications</li>
              <li>Communicate with you about your account and campaigns</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Detect, prevent, and address fraud or technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">4. How We Share Your Information</h2>
            <p className="mt-2">We share your information only in the following circumstances:</p>

            <h3 className="mt-4 font-semibold text-slate-800">Service Providers</h3>
            <p className="mt-1">
              We share data with third-party service providers who perform services on our behalf:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Lob</strong> &mdash; for postcard printing, address verification, and USPS mailing</li>
              <li><strong>Stripe</strong> &mdash; for payment processing</li>
              <li><strong>Supabase</strong> &mdash; for database hosting and authentication</li>
              <li><strong>Vercel</strong> &mdash; for application hosting</li>
            </ul>

            <h3 className="mt-4 font-semibold text-slate-800">Legal Requirements</h3>
            <p className="mt-1">
              We may disclose your information if required by law, regulation, legal process,
              or governmental request.
            </p>

            <p className="mt-4">
              <strong>We do not sell your personal information or your contact data to third parties.</strong>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">5. Data Security</h2>
            <p className="mt-2">
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Encryption in transit (TLS/SSL) and at rest</li>
              <li>Row-level security policies on database tables</li>
              <li>Secure authentication with session management</li>
              <li>Role-based access controls separating agent data</li>
            </ul>
            <p className="mt-2">
              While we strive to protect your information, no method of electronic storage or
              transmission is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">6. Data Retention</h2>
            <p className="mt-2">
              We retain your account information and contact data for as long as your account is
              active or as needed to provide the Service. If you delete your account, we will
              delete your personal data and contact lists within 30 days, except where we are
              required to retain records for legal or accounting purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">7. Your Rights</h2>
            <p className="mt-2">Depending on your location, you may have the right to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your contact data</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:support@from-your-agent.com" className="text-[#E8733A] hover:underline">
                support@from-your-agent.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">8. Cookies</h2>
            <p className="mt-2">
              We use essential cookies for authentication and session management. These cookies
              are necessary for the Service to function and cannot be opted out of. We do not
              use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">9. Children&apos;s Privacy</h2>
            <p className="mt-2">
              The Service is not intended for individuals under the age of 18. We do not knowingly
              collect personal information from children. If we learn that we have collected
              information from a child under 18, we will take steps to delete that information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">10. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by posting the updated policy on this page with a revised &quot;Last updated&quot; date.
              Your continued use of the Service after changes are posted constitutes acceptance of
              the revised policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-slate-900">11. Contact Us</h2>
            <p className="mt-2">
              If you have any questions about this Privacy Policy, please contact us at{" "}
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
