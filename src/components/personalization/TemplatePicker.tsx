"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PanelTemplate } from "@/lib/agent-panel-templates";
import { PANEL_TEMPLATES } from "@/lib/agent-panel-templates";

interface TemplatePickerProps {
  activeKey: string | null;
  onSelect: (template: PanelTemplate) => void;
  brandColor?: string;
}

/** Wireframe thumbnail showing the layout concept for a template */
function Thumbnail({ templateKey, brandColor }: { templateKey: string; brandColor: string }) {
  const bar = "rounded-full";

  if (templateKey === "classic") {
    return (
      <div className="relative w-full h-full">
        {/* Photo block */}
        <div className="absolute left-[3%] top-[8%] w-[28%] h-[74%] bg-gray-200 rounded-sm" />
        {/* Text lines */}
        <div className={cn("absolute left-[36%] top-[10%] w-[50%] h-[4%] bg-gray-700", bar)} />
        <div className={cn("absolute left-[40%] top-[20%] w-[42%] h-[3%]", bar)} style={{ backgroundColor: brandColor, opacity: 0.7 }} />
        <div className={cn("absolute left-[38%] top-[28%] w-[46%] h-[3%] bg-gray-400", bar)} />
        <div className={cn("absolute left-[40%] top-[35%] w-[40%] h-[4%] bg-gray-600", bar)} />
        <div className={cn("absolute left-[42%] top-[44%] w-[36%] h-[2.5%] bg-gray-300", bar)} />
        {/* Logo placeholder */}
        <div className="absolute left-[55%] top-[55%] w-[24%] h-[30%] border border-dashed border-gray-300 rounded-sm" />
      </div>
    );
  }

  if (templateKey === "centered") {
    return (
      <div className="relative w-full h-full">
        {/* Photo centered */}
        <div className="absolute left-[35%] top-[3%] w-[30%] h-[38%] bg-gray-200 rounded-sm" />
        {/* Text lines centered */}
        <div className={cn("absolute left-[20%] top-[46%] w-[60%] h-[4%] bg-gray-700", bar)} />
        <div className={cn("absolute left-[28%] top-[54%] w-[44%] h-[3%]", bar)} style={{ backgroundColor: brandColor, opacity: 0.7 }} />
        <div className={cn("absolute left-[25%] top-[61%] w-[50%] h-[3%] bg-gray-400", bar)} />
        <div className={cn("absolute left-[22%] top-[68%] w-[56%] h-[4%] bg-gray-600", bar)} />
        <div className={cn("absolute left-[30%] top-[76%] w-[40%] h-[2.5%] bg-gray-300", bar)} />
      </div>
    );
  }

  if (templateKey === "photo-focus") {
    return (
      <div className="relative w-full h-full">
        {/* Large photo left */}
        <div className="absolute left-0 top-0 w-[42%] h-[88%] bg-gray-200 rounded-sm" />
        {/* Text lines right */}
        <div className={cn("absolute left-[46%] top-[10%] w-[42%] h-[4%] bg-gray-700", bar)} />
        <div className={cn("absolute left-[46%] top-[19%] w-[30%] h-[2.5%]", bar)} style={{ backgroundColor: brandColor, opacity: 0.7 }} />
        {/* Accent line */}
        <div className="absolute left-[46%] top-[25%] w-[35%] h-[1px]" style={{ backgroundColor: brandColor }} />
        <div className={cn("absolute left-[46%] top-[30%] w-[36%] h-[3%] bg-gray-400", bar)} />
        <div className={cn("absolute left-[46%] top-[37%] w-[40%] h-[3.5%] bg-gray-600", bar)} />
        <div className={cn("absolute left-[46%] top-[44%] w-[34%] h-[2.5%] bg-gray-300", bar)} />
        {/* Logo */}
        <div className="absolute left-[62%] top-[60%] w-[26%] h-[24%] border border-dashed border-gray-300 rounded-sm" />
      </div>
    );
  }

  if (templateKey === "banner") {
    return (
      <div className="relative w-full h-full">
        {/* Brand color header */}
        <div className="absolute left-0 top-0 w-full h-[22%] rounded-t-sm" style={{ backgroundColor: brandColor }} />
        <div className={cn("absolute left-[15%] top-[5%] w-[70%] h-[4%] bg-white/80", bar)} />
        <div className={cn("absolute left-[25%] top-[13%] w-[50%] h-[2.5%] bg-white/50", bar)} />
        {/* Photo below left */}
        <div className="absolute left-[5%] top-[26%] w-[25%] h-[55%] bg-gray-200 rounded-sm" />
        {/* Text right */}
        <div className={cn("absolute left-[34%] top-[28%] w-[40%] h-[3%] bg-gray-400", bar)} />
        <div className={cn("absolute left-[34%] top-[36%] w-[48%] h-[4%] bg-gray-700", bar)} />
        <div className={cn("absolute left-[34%] top-[44%] w-[38%] h-[2.5%] bg-gray-300", bar)} />
        <div className={cn("absolute left-[34%] top-[50%] w-[34%] h-[2.5%] bg-gray-300", bar)} />
        {/* Logo */}
        <div className="absolute left-[62%] top-[60%] w-[26%] h-[22%] border border-dashed border-gray-300 rounded-sm" />
      </div>
    );
  }

  if (templateKey === "contact-card") {
    return (
      <div className="relative w-full h-full">
        {/* Small photo */}
        <div className="absolute left-[3%] top-[10%] w-[22%] h-[40%] bg-gray-200 rounded-sm" />
        {/* Name next to photo */}
        <div className={cn("absolute left-[28%] top-[14%] w-[38%] h-[4%] bg-gray-700", bar)} />
        {/* Accent line */}
        <div className="absolute left-[28%] top-[22%] w-[35%] h-[1px]" style={{ backgroundColor: brandColor }} />
        <div className={cn("absolute left-[28%] top-[27%] w-[30%] h-[2.5%] bg-gray-400", bar)} />
        {/* Logo top-right */}
        <div className="absolute left-[72%] top-[8%] w-[22%] h-[28%] border border-dashed border-gray-300 rounded-sm" />
        {/* Big phone centered */}
        <div className={cn("absolute left-[15%] top-[58%] w-[70%] h-[5%] bg-gray-800", bar)} />
        {/* Contact centered */}
        <div className={cn("absolute left-[20%] top-[68%] w-[60%] h-[2.5%] bg-gray-300", bar)} />
        <div className={cn("absolute left-[25%] top-[74%] w-[50%] h-[2.5%] bg-gray-300", bar)} />
      </div>
    );
  }

  return null;
}

export function TemplatePicker({ activeKey, onSelect, brandColor = "#E8733A" }: TemplatePickerProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Choose a Layout</CardTitle>
        <CardDescription>
          Pick a template — your info fills in automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {PANEL_TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => onSelect(t)}
              className={cn(
                "group relative rounded-lg border-2 p-1 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1",
                activeKey === t.key
                  ? "border-[#E8733A] ring-1 ring-[#E8733A]/30 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              {/* Wireframe preview */}
              <div
                className="relative w-full bg-gray-50 rounded overflow-hidden"
                style={{ aspectRatio: "1387.5 / 937.5" }}
              >
                <Thumbnail templateKey={t.key} brandColor={brandColor} />
              </div>
              {/* Label */}
              <p className={cn(
                "mt-1 text-[10px] font-medium text-center leading-tight",
                activeKey === t.key ? "text-[#E8733A]" : "text-gray-600"
              )}>
                {t.label}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
