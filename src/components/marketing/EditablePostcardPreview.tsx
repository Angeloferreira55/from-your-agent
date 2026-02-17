"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Pencil } from "lucide-react";

export function EditablePostcardPreview() {
  const [name, setName] = useState("Liz Garcia Realtor®");
  const [tagline, setTagline] = useState("Client Focused, Results Driven");
  const [brokerage, setBrokerage] = useState("Keller Williams Realty");
  const [phone, setPhone] = useState("(505) 555-0147");
  const [email, setEmail] = useState("liz.garcia@kw.com");
  const [website, setWebsite] = useState("www.lizgarcia.kwrealty.com");
  const [photoUrl, setPhotoUrl] = useState("/sample-agent-woman.jpg");
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevObjectUrl = useRef<string | null>(null);

  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
    const url = URL.createObjectURL(file);
    prevObjectUrl.current = url;
    setPhotoUrl(url);
  }, []);

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Back of Postcard
      </p>

      {/* Edit toggle */}
      <button
        onClick={() => setEditing(!editing)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#E8733A] hover:text-[#CF6430] transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
        {editing ? "Done editing" : "Customize your info"}
      </button>

      {/* Edit form */}
      {editing && (
        <div className="mb-4 rounded-lg border border-[#E8733A]/20 bg-[#FFF5EE] p-4 space-y-3">
          <p className="text-sm font-semibold text-[#1a1a2e]">Your Information</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E8733A]"
            />
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Tagline"
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E8733A]"
            />
            <input
              type="text"
              value={brokerage}
              onChange={(e) => setBrokerage(e.target.value)}
              placeholder="Brokerage"
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E8733A]"
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E8733A]"
            />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E8733A]"
            />
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website"
              className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#E8733A]"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E8733A] hover:text-[#CF6430]"
          >
            <Camera className="h-3.5 w-3.5" />
            Change headshot photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
      )}

      {/* Postcard back preview */}
      <div className="overflow-hidden rounded-xl border shadow-lg bg-white" style={{ aspectRatio: "9/6" }}>
        <div className="flex flex-col h-full">
          {/* Top half */}
          <div className="flex h-1/2">
            {/* Featured Deal */}
            <div className="flex w-1/2 items-start gap-1.5 p-3 md:p-4">
              <img
                src="/sample-deal-closet-back.png"
                alt="Custom Closet Guys"
                className="h-10 md:h-14 w-auto object-contain rounded mix-blend-multiply shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[5px] md:text-[7px] text-gray-500 leading-tight">
                  Present this postcard and enjoy a FREE Consultation + $250 off your custom closet, as a gift from your friends at {brokerage}!
                </p>
                <p className="text-[5px] md:text-[6.5px] font-semibold text-gray-600 mt-0.5">(505) 546-1788 &bull; customclosetguys.com</p>
              </div>
            </div>
            {/* Brokerage branding */}
            <div
              className="relative flex w-1/2 flex-col p-2 md:p-3 overflow-hidden"
              style={{ backgroundColor: '#B40101' }}
            >
              <img
                src="/brokerages/kw-bg.jpg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
              <div className="absolute inset-0" style={{ backgroundColor: 'rgba(100, 0, 0, 0.55)' }} />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-1.5">
                  <img
                    src="/brokerages/kw-logo-white.png"
                    alt="Keller Williams Realty"
                    className="h-4 md:h-7 w-auto object-contain"
                  />
                </div>
                <div className="my-auto text-center">
                  <p className="text-[8px] md:text-[12px] font-serif italic text-white leading-snug">
                    Not Just Agents.
                  </p>
                  <p className="text-[8px] md:text-[12px] font-serif italic text-white leading-snug">
                    Advisors.
                  </p>
                </div>
                <div className="mt-auto">
                  <div className="flex items-center gap-0.5 md:gap-1">
                    {['f', 'in', 'ig', 'yt'].map((icon) => (
                      <div
                        key={icon}
                        className="h-2 w-2 md:h-3 md:w-3 rounded-sm bg-white/20 flex items-center justify-center"
                      >
                        <span className="text-[3px] md:text-[5px] font-bold text-white">{icon}</span>
                      </div>
                    ))}
                    <p className="text-[4px] md:text-[6px] text-white/90 ml-auto font-medium">www.kw.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fine horizontal line */}
          <div className="h-[0.5px] bg-gray-300 w-full" />

          {/* Bottom half */}
          <div className="flex h-1/2">
            {/* Agent branding — EDITABLE */}
            <div className="flex w-1/2 items-start gap-2 p-3 md:p-4 border-r border-gray-200">
              <div
                className="h-14 w-12 md:h-20 md:w-16 shrink-0 rounded-md border-2 border-[#B40101] overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 cursor-pointer relative group"
                onClick={() => editing && fileInputRef.current?.click()}
              >
                <img
                  src={photoUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
                {editing && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex flex-col justify-center mt-0.5 md:mt-1">
                <p className="text-[9px] md:text-[12px] font-bold text-gray-900 leading-tight">{name}</p>
                <p className="text-[5px] md:text-[7px] italic text-[#B40101] mt-0.5">{tagline}</p>
                <p className="text-[6px] md:text-[8px] font-semibold text-gray-700 mt-0.5">{brokerage}</p>
                <p className="text-[5px] md:text-[7px] text-gray-500 mt-0.5">{phone}</p>
                <p className="text-[4px] md:text-[6px] text-gray-500">{email}</p>
                <p className="text-[4px] md:text-[6px] text-gray-500">{website}</p>
              </div>
            </div>
            {/* Mailing area */}
            <div className="flex w-1/2 flex-col justify-between p-2 md:p-3 bg-white">
              <div className="flex justify-end">
                <div className="h-5 w-7 md:h-7 md:w-9 border border-dashed border-gray-300 rounded-sm flex items-center justify-center">
                  <p className="text-[4px] md:text-[6px] text-gray-400 text-center leading-tight">POSTAGE</p>
                </div>
              </div>
              <div className="mt-auto space-y-0.5">
                <div className="h-[0.5px] bg-gray-300 w-3/4 ml-auto" />
                <div className="h-[0.5px] bg-gray-300 w-3/4 ml-auto" />
                <div className="h-[0.5px] bg-gray-300 w-3/4 ml-auto" />
              </div>
              <p className="text-[3px] md:text-[4.5px] text-gray-400 leading-tight mt-1">
                For questions about this postcard or offer please call {phone} &bull; www.FromYourAgent.com &bull; Each office is independently owned and operated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
