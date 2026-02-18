"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, ArrowRight, X } from "lucide-react";

const navLinks = [
  { label: "Our Approach", href: "/why" },
  { label: "The Process", href: "/how-it-works" },
  { label: "Next Campaign", href: "/upcoming-postcard" },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo-transparent.png" alt="From Your Agent" className="h-40 w-auto" />
          <div className="hidden sm:block">
            <span className="block text-xl font-black tracking-tight text-[#0B1F3B] leading-tight">
              From Your Agent
            </span>
            <span className="block text-[11px] font-medium tracking-widest uppercase text-[#E8733A]">
              Relationship Marketing
            </span>
          </div>
        </Link>

        {/* Desktop Nav — pill container */}
        <nav className="hidden lg:flex items-center rounded-full bg-gray-50 px-2 py-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-5 py-2 text-[15px] font-semibold text-[#0B1F3B] hover:bg-white hover:shadow-sm transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-[15px] font-semibold text-[#0B1F3B]">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="default" className="bg-[#E8733A] hover:bg-[#CF6430] text-white rounded-full px-7 text-[15px] font-semibold shadow-lg shadow-[#E8733A]/20">
              Get Started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6 text-[#0B1F3B]" />
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="h-auto rounded-b-2xl shadow-2xl border-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col items-center gap-1 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center rounded-xl px-4 py-3.5 text-lg font-semibold text-[#0B1F3B] hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="w-full border-t mt-3 pt-4 space-y-3 px-4">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full text-base font-semibold rounded-full">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-[#E8733A] hover:bg-[#CF6430] text-white text-base font-semibold rounded-full shadow-lg shadow-[#E8733A]/20">
                    Get Started
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
