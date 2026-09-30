"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#E8733A] px-5 py-3 font-semibold text-white shadow-lg hover:bg-[#CF6430]"
    >
      <Printer className="h-5 w-5" /> Print this flyer
    </button>
  );
}
