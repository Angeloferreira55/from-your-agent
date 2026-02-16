import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "FAQ — From Your Agent",
  description: "Frequently asked questions about From Your Agent relationship marketing platform.",
};

const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is From Your Agent?",
        a: "From Your Agent is a relationship marketing platform for real estate agents. We send monthly physical postcards featuring local merchant deals to your clients and friends — personalized with your branding. It's the easiest way to stay top of mind and drive referrals.",
      },
      {
        q: "How do I sign up?",
        a: "Click 'Get Started', create your account with your name and email, and you're in. You can upload your contacts and personalize your postcards right away.",
      },
      {
        q: "How long does it take to get started?",
        a: "Most agents are fully set up in under 15 minutes. Upload your CSV, customize your postcard branding, and you're ready for the next campaign.",
      },
      {
        q: "Do I need to be a real estate agent to use this?",
        a: "We're currently focused on real estate agents, as the platform is designed specifically for relationship-based businesses where staying top of mind with your sphere drives referrals.",
      },
    ],
  },
  {
    category: "Contacts & Database",
    questions: [
      {
        q: "How do I upload my contacts?",
        a: "You can upload a CSV file exported from any CRM (KVCore, Follow Up Boss, etc.). Our smart column mapper auto-detects fields like name, address, email, and phone. You can also add contacts manually one at a time.",
      },
      {
        q: "Do you verify addresses?",
        a: "Yes. Every address goes through CASS-certified verification to ensure deliverability. We'll flag any addresses that can't be delivered to so you don't waste money on bad mail.",
      },
      {
        q: "Can I choose which contacts receive postcards?",
        a: "Absolutely. When you opt into a campaign, you can select specific contacts or send to your entire database. You can also mark contacts as 'do not mail' at any time.",
      },
      {
        q: "Is my contact data secure?",
        a: "Yes. Your data is stored securely with row-level security — only you can see your contacts. We never share or sell your data.",
      },
    ],
  },
  {
    category: "Postcards & Mailing",
    questions: [
      {
        q: "What size are the postcards?",
        a: "We print standard 6x9 inch full-color postcards on premium cardstock — the same size used by major direct mail companies. They're large enough to stand out in the mailbox.",
      },
      {
        q: "What's on the front of the postcard?",
        a: "The front features curated local merchant deals — discounts at restaurants, cafes, spas, gyms, bakeries, vetted professionals and more. These are the same for all agents in a given month.",
      },
      {
        q: "What's on the back?",
        a: "The back is fully personalized with your branding: headshot, company logo, name, brokerage, tagline, and a custom message. Plus the recipient's address and postage.",
      },
      {
        q: "How long does delivery take?",
        a: "Postcards are sent via USPS First-Class Mail and typically arrive the first week of each month. You can track delivery status in your dashboard.",
      },
      {
        q: "Can I preview my postcard before it's mailed?",
        a: "Yes! Our live preview shows you exactly what the front and back of your postcard will look like before it goes out. You can make changes to your branding at any time.",
      },
    ],
  },
  {
    category: "Offers & Merchants",
    questions: [
      {
        q: "Where do the offers come from?",
        a: "Our team curates exclusive deals from popular local merchants in your market. We focus on businesses your contacts will love — restaurants, cafes, spas, gyms, bakeries, and more.",
      },
      {
        q: "Are the offers the same for everyone?",
        a: "Yes! Every month, all agents send the same curated postcard featuring a great local merchant deal. This keeps things simple and ensures every contact receives a high-quality, professionally designed offer.",
      },
      {
        q: "Do I need to find merchants myself?",
        a: "No! We handle all merchant recruitment and offer curation. You just focus on your contacts and your branding.",
      },
    ],
  },
  {
    category: "Billing & Pricing",
    questions: [
      {
        q: "How much does it cost?",
        a: "Pricing starts at $1.25 per mailed card for 1-99 cards/month, with volume discounts at 100+ ($1.10) and 500+ ($1.00). There are no monthly fees, setup fees, or contracts.",
      },
      {
        q: "Is there a minimum number of cards?",
        a: "No minimums. Send to as few as 1 contact or as many as you want. Your per-card price drops automatically as your volume increases.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes. There are no contracts or cancellation fees. You can opt out of any campaign or close your account at any time.",
      },
      {
        q: "When am I charged?",
        a: "You're billed after each campaign mails. Your invoice reflects the exact number of postcards sent, at the appropriate volume tier.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#FFF5EE] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-[#1a1a2e] md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about From Your Agent.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 space-y-12">
          {faqCategories.map((category) => (
            <div key={category.category}>
              <h2 className="font-serif text-xl font-bold text-[#1a1a2e] mb-4">{category.category}</h2>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, i) => (
                  <AccordionItem key={i} value={`${category.category}-${i}`}>
                    <AccordionTrigger className="text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-[#FFF5EE] py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-bold text-[#1a1a2e]">Still have questions?</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Email us at support@fromyouragent.com or sign up and try it out yourself.
          </p>
          <Link href="/signup">
            <Button size="lg" className="mt-6 bg-[#E8733A] hover:bg-[#CF6430] text-white text-lg px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
