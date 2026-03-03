import Link from "next/link";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-slate-900 py-12 text-slate-400">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="From Your Agent" className="h-10 w-auto" />
            </div>
            <p className="mt-3 text-sm">
              Relationship marketing for real estate agents. Stay top of mind with monthly postcards.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">The Process</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-white transition-colors">Agent Login</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Get Started</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@from-your-agent.com" className="hover:text-white transition-colors">support@from-your-agent.com</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm">
          &copy; {new Date().getFullYear()} From Your Agent. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
