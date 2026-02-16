"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Mail,
  Upload,
  Palette,
  MapPin,
  Send,
  HelpCircle,
  Newspaper,
  Menu,
  ChevronRight,
} from "lucide-react";

const howItWorksItems = [
  {
    icon: Upload,
    title: "Upload Your Database",
    description: "Import your SOI from any CRM via CSV or add manually.",
    href: "/how-it-works",
  },
  {
    icon: Palette,
    title: "Personalize Your Card",
    description: "Add your headshot, logo, and a personal message.",
    href: "/how-it-works",
  },
  {
    icon: MapPin,
    title: "We Match Local Offers",
    description: "Curated local merchant deals featured on every postcard.",
    href: "/how-it-works",
  },
  {
    icon: Mail,
    title: "Postcards Are Mailed",
    description: "6x9 full-color cards delivered via USPS monthly.",
    href: "/how-it-works",
  },
];

const learnMoreItems = [
  {
    icon: HelpCircle,
    title: "FAQ",
    description: "Answers to common questions about the platform.",
    href: "/faq",
  },
  {
    icon: Newspaper,
    title: "Upcoming Postcard",
    description: "See this month's curated local merchant deals.",
    href: "/how-it-works",
  },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="From Your Agent" className="h-10 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* How It Works Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-sm font-medium">
                How It Works
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[480px] gap-1 p-4 md:grid-cols-2">
                  {howItWorksItems.map((item) => (
                    <li key={item.title}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className="flex items-start gap-3 rounded-md p-3 hover:bg-[#FFF5EE] transition-colors"
                        >
                          <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3A5C]" />
                          <div>
                            <div className="text-sm font-semibold">{item.title}</div>
                            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Learn More Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-sm font-medium">
                Learn More
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[360px] gap-1 p-4">
                  {learnMoreItems.map((item) => (
                    <li key={item.title}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className="flex items-start gap-3 rounded-md p-3 hover:bg-[#FFF5EE] transition-colors"
                        >
                          <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3A5C]" />
                          <div>
                            <div className="text-sm font-semibold">{item.title}</div>
                            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Pricing */}
            <NavigationMenuItem>
              <Link href="/pricing" className="text-sm font-medium px-4 py-2 hover:text-[#E8733A] transition-colors">
                Pricing
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-[#E8733A] hover:bg-[#CF6430] text-white">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col gap-6 mt-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  How It Works
                </p>
                <div className="space-y-1">
                  {howItWorksItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-md p-2.5 hover:bg-[#FFF5EE] transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-[#1B3A5C]" />
                      <span className="text-sm font-medium">{item.title}</span>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Learn More
                </p>
                <div className="space-y-1">
                  {learnMoreItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-md p-2.5 hover:bg-[#FFF5EE] transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-[#1B3A5C]" />
                      <span className="text-sm font-medium">{item.title}</span>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Log In</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-[#E8733A] hover:bg-[#CF6430] text-white">
                    Get Started
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
