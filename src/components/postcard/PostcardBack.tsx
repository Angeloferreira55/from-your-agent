"use client";

import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import type { PostcardVisibleFields } from "@/types/database";
import type { DesignConfig } from "@/components/admin/TemplateDesigner";
import { recolorSvgDataUri } from "@/components/admin/TemplateDesigner";

const FONT_MAP: Record<string, string> = {
  "sans-serif": "Arial, Helvetica, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  tahoma: "Tahoma, Geneva, sans-serif",
  trebuchet: "'Trebuchet MS', Helvetica, sans-serif",
  calibri: "Calibri, 'Gill Sans', sans-serif",
  segoe: "'Segoe UI', Tahoma, sans-serif",
  serif: "Georgia, serif",
  georgia: "Georgia, serif",
  times: "'Times New Roman', Times, serif",
  palatino: "'Palatino Linotype', Palatino, serif",
  garamond: "Garamond, serif",
  bookman: "'Bookman Old Style', Bookman, serif",
  cambria: "Cambria, Georgia, serif",
  courier: "'Courier New', Courier, monospace",
  consolas: "Consolas, 'Courier New', monospace",
  monaco: "Monaco, 'Courier New', monospace",
  impact: "Impact, 'Arial Black', sans-serif",
  "century-gothic": "'Century Gothic', 'Apple Gothic', sans-serif",
  futura: "Futura, 'Century Gothic', sans-serif",
  "gill-sans": "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif",
  optima: "Optima, 'Segoe UI', sans-serif",
  candara: "Candara, Calibri, sans-serif",
  franklin: "'Franklin Gothic Medium', 'Franklin Gothic', sans-serif",
};

const DEFAULT_VISIBLE: PostcardVisibleFields = {
  phone: true,
  email: true,
  license: true,
  website: false,
  brokerage_info: true,
};

/* ── Seasonal Footer Themes ── */
interface SeasonalTheme {
  label: string;
  gradient: string;
  shapes: string; // inline SVG markup for decorative shapes
}

const SEASONAL_FOOTERS: Record<string, SeasonalTheme> = {
  none: { label: "None", gradient: "", shapes: "" },
  january: {
    label: "New Year",
    gradient: "linear-gradient(90deg, #1e3a5f 0%, #c9a84c 50%, #1e3a5f 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><circle cx="20" cy="6" r="1.5" fill="rgba(255,215,0,0.7)"/><circle cx="50" cy="12" r="1" fill="rgba(255,255,255,0.5)"/><circle cx="80" cy="4" r="1.2" fill="rgba(255,215,0,0.6)"/><circle cx="110" cy="14" r="1" fill="rgba(255,255,255,0.4)"/><circle cx="140" cy="8" r="1.5" fill="rgba(255,215,0,0.7)"/><circle cx="170" cy="10" r="1" fill="rgba(255,255,255,0.5)"/><polygon points="30,2 31,5 34,5 31.5,7 32.5,10 30,8 27.5,10 28.5,7 26,5 29,5" fill="rgba(255,215,0,0.5)"/><polygon points="100,3 101,6 104,6 101.5,8 102.5,11 100,9 97.5,11 98.5,8 96,6 99,6" fill="rgba(255,215,0,0.4)"/><polygon points="160,4 161,7 164,7 161.5,9 162.5,12 160,10 157.5,12 158.5,9 156,7 159,7" fill="rgba(255,215,0,0.5)"/></svg>`,
  },
  february: {
    label: "Valentine's",
    gradient: "linear-gradient(90deg, #f9a8c9 0%, #e8314f 50%, #f9a8c9 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><path d="M15,8 C15,5 18,4 20,7 C22,4 25,5 25,8 C25,12 20,15 20,15 C20,15 15,12 15,8Z" fill="rgba(255,255,255,0.5)"/><path d="M55,6 C55,4 57,3 58,5 C59,3 61,4 61,6 C61,9 58,11 58,11 C58,11 55,9 55,6Z" fill="rgba(255,255,255,0.4)"/><path d="M95,8 C95,5 98,4 100,7 C102,4 105,5 105,8 C105,12 100,15 100,15 C100,15 95,12 95,8Z" fill="rgba(255,255,255,0.5)"/><path d="M135,6 C135,4 137,3 138,5 C139,3 141,4 141,6 C141,9 138,11 138,11 C138,11 135,9 135,6Z" fill="rgba(255,255,255,0.4)"/><path d="M175,8 C175,5 178,4 180,7 C182,4 185,5 185,8 C185,12 180,15 180,15 C180,15 175,12 175,8Z" fill="rgba(255,255,255,0.5)"/></svg>`,
  },
  march: {
    label: "St. Patrick's",
    gradient: "linear-gradient(90deg, #2d8f4e 0%, #4fc978 50%, #2d8f4e 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><g fill="rgba(255,255,255,0.45)"><circle cx="20" cy="7" r="2.5"/><circle cx="17" cy="9" r="2.5"/><circle cx="23" cy="9" r="2.5"/><rect x="19.5" y="10" width="1" height="5" rx="0.5"/></g><g fill="rgba(255,255,255,0.35)"><circle cx="70" cy="8" r="2"/><circle cx="68" cy="10" r="2"/><circle cx="72" cy="10" r="2"/><rect x="69.5" y="11" width="1" height="4" rx="0.5"/></g><g fill="rgba(255,255,255,0.45)"><circle cx="120" cy="7" r="2.5"/><circle cx="117" cy="9" r="2.5"/><circle cx="123" cy="9" r="2.5"/><rect x="119.5" y="10" width="1" height="5" rx="0.5"/></g><g fill="rgba(255,255,255,0.35)"><circle cx="170" cy="8" r="2"/><circle cx="168" cy="10" r="2"/><circle cx="172" cy="10" r="2"/><rect x="169.5" y="11" width="1" height="4" rx="0.5"/></g></svg>`,
  },
  april: {
    label: "Spring",
    gradient: "linear-gradient(90deg, #a8d8a8 0%, #f5e663 50%, #a8d8a8 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><g fill="rgba(255,255,255,0.6)"><circle cx="25" cy="10" r="2"/><circle cx="25" cy="6" r="1.5"/><circle cx="28" cy="8.5" r="1.5"/><circle cx="22" cy="8.5" r="1.5"/><circle cx="25" cy="10" r="1" fill="rgba(255,200,0,0.7)"/></g><g fill="rgba(255,255,255,0.5)"><circle cx="75" cy="10" r="2"/><circle cx="75" cy="6" r="1.5"/><circle cx="78" cy="8.5" r="1.5"/><circle cx="72" cy="8.5" r="1.5"/><circle cx="75" cy="10" r="1" fill="rgba(255,200,0,0.7)"/></g><g fill="rgba(255,255,255,0.6)"><circle cx="125" cy="10" r="2"/><circle cx="125" cy="6" r="1.5"/><circle cx="128" cy="8.5" r="1.5"/><circle cx="122" cy="8.5" r="1.5"/><circle cx="125" cy="10" r="1" fill="rgba(255,200,0,0.7)"/></g><g fill="rgba(255,255,255,0.5)"><circle cx="175" cy="10" r="2"/><circle cx="175" cy="6" r="1.5"/><circle cx="178" cy="8.5" r="1.5"/><circle cx="172" cy="8.5" r="1.5"/><circle cx="175" cy="10" r="1" fill="rgba(255,200,0,0.7)"/></g></svg>`,
  },
  may: {
    label: "Mother's Day",
    gradient: "linear-gradient(90deg, #f4a6d7 0%, #d8b4fe 50%, #f4a6d7 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><g fill="rgba(255,255,255,0.55)"><ellipse cx="20" cy="8" rx="2.5" ry="4" transform="rotate(-20 20 8)"/><ellipse cx="24" cy="8" rx="2.5" ry="4" transform="rotate(20 24 8)"/><circle cx="22" cy="9" r="1.5" fill="rgba(255,200,150,0.6)"/></g><g fill="rgba(255,255,255,0.45)"><ellipse cx="80" cy="9" rx="2" ry="3.5" transform="rotate(-15 80 9)"/><ellipse cx="83" cy="9" rx="2" ry="3.5" transform="rotate(15 83 9)"/><circle cx="81.5" cy="10" r="1.2" fill="rgba(255,200,150,0.6)"/></g><g fill="rgba(255,255,255,0.55)"><ellipse cx="140" cy="8" rx="2.5" ry="4" transform="rotate(-20 140 8)"/><ellipse cx="144" cy="8" rx="2.5" ry="4" transform="rotate(20 144 8)"/><circle cx="142" cy="9" r="1.5" fill="rgba(255,200,150,0.6)"/></g></svg>`,
  },
  june: {
    label: "Summer",
    gradient: "linear-gradient(90deg, #87ceeb 0%, #ffd700 50%, #87ceeb 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><circle cx="40" cy="10" r="3" fill="rgba(255,255,255,0.5)"/><line x1="40" y1="4" x2="40" y2="3" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/><line x1="40" y1="16" x2="40" y2="17" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/><line x1="34" y1="10" x2="33" y2="10" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/><line x1="46" y1="10" x2="47" y2="10" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/><circle cx="120" cy="10" r="3" fill="rgba(255,255,255,0.5)"/><line x1="120" y1="4" x2="120" y2="3" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/><line x1="120" y1="16" x2="120" y2="17" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/><line x1="114" y1="10" x2="113" y2="10" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/><line x1="126" y1="10" x2="127" y2="10" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/></svg>`,
  },
  july: {
    label: "Independence Day",
    gradient: "linear-gradient(90deg, #bf0a30 0%, #ffffff 25%, #002868 50%, #ffffff 75%, #bf0a30 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><polygon points="20,3 21.5,7 25.5,7 22.2,9.5 23.5,13.5 20,11 16.5,13.5 17.8,9.5 14.5,7 18.5,7" fill="rgba(255,255,255,0.6)"/><polygon points="60,5 61,8 64,8 61.5,9.8 62.5,13 60,11 57.5,13 58.5,9.8 56,8 59,8" fill="rgba(255,215,0,0.5)"/><polygon points="100,3 101.5,7 105.5,7 102.2,9.5 103.5,13.5 100,11 96.5,13.5 97.8,9.5 94.5,7 98.5,7" fill="rgba(255,255,255,0.6)"/><polygon points="140,5 141,8 144,8 141.5,9.8 142.5,13 140,11 137.5,13 138.5,9.8 136,8 139,8" fill="rgba(255,215,0,0.5)"/><polygon points="180,3 181.5,7 185.5,7 182.2,9.5 183.5,13.5 180,11 176.5,13.5 177.8,9.5 174.5,7 178.5,7" fill="rgba(255,255,255,0.6)"/></svg>`,
  },
  august: {
    label: "Late Summer",
    gradient: "linear-gradient(90deg, #f97316 0%, #0d9488 50%, #f97316 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><path d="M0,14 Q10,4 20,12 Q30,4 40,14 Q50,4 60,12 Q70,4 80,14 Q90,4 100,12 Q110,4 120,14 Q130,4 140,12 Q150,4 160,14 Q170,4 180,12 Q190,4 200,14" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/><path d="M0,16 Q10,8 20,14 Q30,8 40,16 Q50,8 60,14 Q70,8 80,16 Q90,8 100,14 Q110,8 120,16 Q130,8 140,14 Q150,8 160,16 Q170,8 180,14 Q190,8 200,16" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/></svg>`,
  },
  september: {
    label: "Fall",
    gradient: "linear-gradient(90deg, #d97706 0%, #92400e 50%, #d97706 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><path d="M20,10 Q22,5 25,8 Q27,4 28,8 Q24,12 20,10Z" fill="rgba(255,255,255,0.4)"/><path d="M70,12 Q72,7 75,10 Q77,6 78,10 Q74,14 70,12Z" fill="rgba(255,200,100,0.4)"/><path d="M120,10 Q122,5 125,8 Q127,4 128,8 Q124,12 120,10Z" fill="rgba(255,255,255,0.4)"/><path d="M170,12 Q172,7 175,10 Q177,6 178,10 Q174,14 170,12Z" fill="rgba(255,200,100,0.4)"/></svg>`,
  },
  october: {
    label: "Halloween",
    gradient: "linear-gradient(90deg, #f97316 0%, #1c1917 50%, #f97316 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <g fill="rgba(255,165,0,0.6)"><ellipse cx="20" cy="10" rx="5" ry="4.5"/><ellipse cx="20" cy="10" rx="3" ry="4.5" fill="rgba(255,140,0,0.5)"/><rect x="19" y="4" width="2" height="3" rx="1" fill="rgba(100,200,50,0.6)"/><rect x="17.5" y="7.5" width="1.5" height="1" rx="0.3" fill="rgba(0,0,0,0.5)"/><rect x="21" y="7.5" width="1.5" height="1" rx="0.3" fill="rgba(0,0,0,0.5)"/><path d="M18,11 Q20,13 22,11" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="0.6"/></g>
      <g fill="rgba(255,255,255,0.3)"><path d="M55,4 Q56,2 57,4 L59,2 Q58,6 59,8 Q57,10 55,10 Q53,10 51,8 Q52,6 51,2Z"/></g>
      <g fill="rgba(255,165,0,0.55)"><ellipse cx="85" cy="10" rx="4" ry="3.8"/><ellipse cx="85" cy="10" rx="2.5" ry="3.8" fill="rgba(255,140,0,0.4)"/><rect x="84" y="5" width="2" height="2.5" rx="0.8" fill="rgba(100,200,50,0.5)"/><rect x="83" y="8" width="1.2" height="0.8" rx="0.3" fill="rgba(0,0,0,0.5)"/><rect x="85.8" y="8" width="1.2" height="0.8" rx="0.3" fill="rgba(0,0,0,0.5)"/><path d="M83.5,11.5 Q85,13 86.5,11.5" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="0.5"/></g>
      <polygon points="115,3 116,6 119,6.5 116.5,8.5 117.5,11.5 115,9.5 112.5,11.5 113.5,8.5 111,6.5 114,6" fill="rgba(255,215,0,0.4)"/>
      <g fill="rgba(255,165,0,0.6)"><ellipse cx="145" cy="10" rx="5.5" ry="5"/><ellipse cx="145" cy="10" rx="3.5" ry="5" fill="rgba(255,140,0,0.5)"/><rect x="144" y="3.5" width="2" height="3" rx="1" fill="rgba(100,200,50,0.6)"/><rect x="142.5" y="7.5" width="1.5" height="1" rx="0.3" fill="rgba(0,0,0,0.5)"/><rect x="146" y="7.5" width="1.5" height="1" rx="0.3" fill="rgba(0,0,0,0.5)"/><path d="M143,12 Q145,14 147,12" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="0.6"/></g>
      <g fill="rgba(255,255,255,0.25)"><path d="M175,5 Q176,3 177,5 L179,3 Q178,7 179,9 Q177,11 175,11 Q173,11 171,9 Q172,7 171,3Z"/></g>
    </svg>`,
  },
  november: {
    label: "Thanksgiving",
    gradient: "linear-gradient(90deg, #92400e 0%, #ca8a04 50%, #92400e 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <g fill="rgba(255,255,255,0.5)"><ellipse cx="20" cy="12" rx="3" ry="2.5"/><circle cx="20" cy="9" r="1.5"/><path d="M17,8 Q15,4 18,5" stroke="rgba(200,100,50,0.5)" fill="rgba(200,100,50,0.4)" stroke-width="0.3"/><path d="M19,7 Q18,3 20,4" stroke="rgba(255,180,0,0.5)" fill="rgba(255,180,0,0.4)" stroke-width="0.3"/><path d="M21,7 Q22,3 20,4" stroke="rgba(180,60,30,0.5)" fill="rgba(180,60,30,0.4)" stroke-width="0.3"/><path d="M23,8 Q25,4 22,5" stroke="rgba(200,100,50,0.5)" fill="rgba(200,100,50,0.4)" stroke-width="0.3"/><path d="M19,10 L18.5,11.5" stroke="rgba(255,150,0,0.5)" stroke-width="0.5" fill="none"/></g>
      <path d="M55,10 Q57,5 60,8 Q62,4 63,8 Q59,13 55,10Z" fill="rgba(255,180,80,0.4)"/>
      <path d="M75,12 Q77,7 80,10 Q82,6 83,10 Q79,14 75,12Z" fill="rgba(255,215,0,0.4)"/>
      <g fill="rgba(255,255,255,0.45)"><ellipse cx="105" cy="12" rx="3.5" ry="2.8"/><circle cx="105" cy="9" r="1.8"/><path d="M102,8 Q100,3 103,5" stroke="rgba(200,100,50,0.5)" fill="rgba(200,100,50,0.45)" stroke-width="0.3"/><path d="M104,7 Q103,2 105,4" stroke="rgba(255,180,0,0.5)" fill="rgba(255,180,0,0.45)" stroke-width="0.3"/><path d="M106,7 Q107,2 105,4" stroke="rgba(180,60,30,0.5)" fill="rgba(180,60,30,0.45)" stroke-width="0.3"/><path d="M108,8 Q110,3 107,5" stroke="rgba(200,100,50,0.5)" fill="rgba(200,100,50,0.45)" stroke-width="0.3"/><path d="M104,10 L103.5,11.5" stroke="rgba(255,150,0,0.5)" stroke-width="0.5" fill="none"/></g>
      <path d="M135,10 Q137,5 140,8 Q142,4 143,8 Q139,12 135,10Z" fill="rgba(255,215,0,0.4)"/>
      <g fill="rgba(255,200,100,0.4)"><ellipse cx="165" cy="13" rx="5" ry="2"/><ellipse cx="162" cy="12" rx="2" ry="1.5"/><ellipse cx="168" cy="12" rx="2" ry="1.5"/><ellipse cx="165" cy="11" rx="1.5" ry="2" fill="rgba(200,150,80,0.4)"/></g>
      <path d="M185,12 Q187,7 190,10 Q192,6 193,10 Q189,14 185,12Z" fill="rgba(255,180,80,0.35)"/>
    </svg>`,
  },
  december: {
    label: "Holidays",
    gradient: "linear-gradient(90deg, #dc2626 0%, #16a34a 50%, #dc2626 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><g fill="rgba(255,255,255,0.5)"><line x1="20" y1="3" x2="20" y2="5" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/><line x1="18" y1="4" x2="22" y2="4" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/><line x1="18.5" y1="2.5" x2="21.5" y2="5.5" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/><line x1="21.5" y1="2.5" x2="18.5" y2="5.5" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/></g><g fill="rgba(255,255,255,0.4)"><line x1="70" y1="8" x2="70" y2="12" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/><line x1="68" y1="10" x2="72" y2="10" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/><line x1="68.5" y1="8.5" x2="71.5" y2="11.5" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/><line x1="71.5" y1="8.5" x2="68.5" y2="11.5" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/></g><g><line x1="120" y1="5" x2="120" y2="9" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/><line x1="118" y1="7" x2="122" y2="7" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"/><line x1="118.5" y1="5.5" x2="121.5" y2="8.5" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/><line x1="121.5" y1="5.5" x2="118.5" y2="8.5" stroke="rgba(255,255,255,0.5)" stroke-width="0.5"/></g><g><line x1="170" y1="10" x2="170" y2="14" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/><line x1="168" y1="12" x2="172" y2="12" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/><line x1="168.5" y1="10.5" x2="171.5" y2="13.5" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/><line x1="171.5" y1="10.5" x2="168.5" y2="13.5" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/></g></svg>`,
  },
  social: {
    label: "Social Media",
    gradient: "linear-gradient(90deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <text x="40" y="10" font-family="Arial,sans-serif" font-size="4.5" fill="rgba(255,255,255,0.55)" text-anchor="middle" dominant-baseline="central">Follow us</text>
      <svg x="68" y="4" width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.75)"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      <svg x="82" y="4" width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.75)"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
      <svg x="96" y="4" width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.75)"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      <svg x="110" y="4" width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.75)"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      <svg x="124" y="4" width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,255,255,0.75)"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      <text x="160" y="10" font-family="Arial,sans-serif" font-size="4.5" fill="rgba(255,255,255,0.55)" text-anchor="middle" dominant-baseline="central">on social</text>
    </svg>`,
  },
  consultation: {
    label: "Free Consult",
    gradient: "linear-gradient(90deg, #0a0a0a 0%, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%, #0a0a0a 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <g fill="none" stroke="rgba(212,175,55,0.6)" stroke-width="0.5"><rect x="12" y="5" width="5" height="9" rx="0.9"/><line x1="13.8" y1="12.5" x2="15.2" y2="12.5"/><circle cx="14.5" cy="6.5" r="0.3" fill="rgba(212,175,55,0.6)"/></g>
      <text x="100" y="10" font-family="Georgia,serif" font-size="5.5" font-weight="bold" fill="rgba(212,175,55,0.9)" text-anchor="middle" dominant-baseline="central" letter-spacing="0.8">Call us for a free consultation</text>
      <g fill="none" stroke="rgba(212,175,55,0.6)" stroke-width="0.5"><rect x="183" y="5" width="5" height="9" rx="0.9"/><line x1="184.8" y1="12.5" x2="186.2" y2="12.5"/><circle cx="185.5" cy="6.5" r="0.3" fill="rgba(212,175,55,0.6)"/></g>
    </svg>`,
  },
  referral: {
    label: "Referrals",
    gradient: "linear-gradient(90deg, #1a3a2a 0%, #2d6a4f 25%, #40916c 50%, #2d6a4f 75%, #1a3a2a 100%)",
    shapes: `<svg viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <text x="100" y="10" font-family="Georgia,serif" font-size="5" font-weight="bold" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="central" letter-spacing="0.6">Your Referrals Are Our Greatest Reward</text>
    </svg>`,
  },
};

const MONTH_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function resolveSeasonalKey(footer: string | null | undefined, campaignMonth?: number): string {
  if (!footer || footer === "none") return "none";
  if (footer === "auto") {
    const m = campaignMonth ?? new Date().getMonth(); // 0-indexed
    return MONTH_KEYS[m] || "none";
  }
  return footer;
}

export { SEASONAL_FOOTERS, MONTH_KEYS, resolveSeasonalKey };

interface PostcardBackProps {
  agentName?: string;
  companyName?: string | null;
  tagline?: string | null;
  customMessage?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  licenseNumber?: string | null;
  teamLogoUrl?: string | null;
  brokerageLogoUrl?: string | null;
  photoUrl?: string | null;
  brandColor?: string;
  brokeragePhone?: string | null;
  brokerageAddress?: string | null;
  visibleFields?: PostcardVisibleFields;
  recipientName?: string;
  recipientAddress?: string;
  // Brokerage-specific props (from admin config)
  brokerageSlogan?: string | null;
  brokerageBackgroundUrl?: string | null;
  brokerageOverlayColor?: string | null;
  brokerageTextColor?: string | null;
  brokerageSocialLinks?: Record<string, string> | null;
  brokerageDisclaimer?: string | null;
  templateDesign?: DesignConfig | null;
  agentCardDesign?: DesignConfig | null;
  seasonalFooter?: string | null;
  campaignMonth?: number;
  className?: string;
}

export function PostcardBack({
  agentName = "Jane Smith",
  companyName = "Keller Williams Realty",
  tagline = "Your trusted neighborhood agent",
  customMessage = "Thanks for being a valued part of my network! Enjoy these exclusive local deals — and remember, I'm always here for your real estate needs.",
  phone = "(555) 123-4567",
  email = "jane@example.com",
  website = null,
  licenseNumber = "DRE #01234567",
  teamLogoUrl = null,
  brokerageLogoUrl = null,
  photoUrl = null,
  brandColor = "#C02646",
  brokeragePhone = null,
  brokerageAddress = null,
  visibleFields = DEFAULT_VISIBLE,
  recipientName = "John & Sarah Johnson",
  recipientAddress = "123 Main Street\nAnytown, CA 90210",
  brokerageSlogan = null,
  brokerageBackgroundUrl = null,
  brokerageOverlayColor = null,
  brokerageTextColor = null,
  brokerageSocialLinks = null,
  brokerageDisclaimer = null,
  templateDesign = null,
  agentCardDesign = null,
  seasonalFooter = "auto",
  campaignMonth,
  className,
}: PostcardBackProps) {
  const v = { ...DEFAULT_VISIBLE, ...visibleFields };
  const overlayColor = brokerageOverlayColor || "rgba(0, 0, 0, 0.35)";
  const textColor = brokerageTextColor || "#FFFFFF";
  const resolvedSeason = resolveSeasonalKey(seasonalFooter, campaignMonth);
  const seasonTheme = SEASONAL_FOOTERS[resolvedSeason];

  // Build social icons from brokerage config
  const socialIcons: { key: string; label: string }[] = [];
  if (brokerageSocialLinks) {
    if (brokerageSocialLinks.facebook) socialIcons.push({ key: "facebook", label: "f" });
    if (brokerageSocialLinks.linkedin) socialIcons.push({ key: "linkedin", label: "in" });
    if (brokerageSocialLinks.instagram) socialIcons.push({ key: "instagram", label: "ig" });
    if (brokerageSocialLinks.youtube) socialIcons.push({ key: "youtube", label: "yt" });
    if (brokerageSocialLinks.twitter) socialIcons.push({ key: "twitter", label: "X" });
  }
  // Fallback to generic icons if no social links configured
  const displayIcons = socialIcons.length > 0
    ? socialIcons
    : [{ key: "f", label: "f" }, { key: "in", label: "in" }, { key: "ig", label: "ig" }, { key: "yt", label: "yt" }];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-white shadow-sm",
        className
      )}
      style={{ aspectRatio: "9/6" }}
    >
      <div className="flex flex-col h-full">
        {/* ── Top half ── */}
        <div className="flex h-1/2">
          {/* Top-left: Featured Deal (auto-populated from campaign) */}
          <div className="flex w-1/2 items-center justify-center p-3 md:p-4 bg-gray-50">
            <div className="text-center">
              <p className="text-[7px] md:text-[10px] font-medium text-gray-400">
                Featured Offer
              </p>
              <p className="text-[5px] md:text-[7px] text-gray-300 mt-0.5">
                Auto-populated from campaign
              </p>
            </div>
          </div>

          {/* Top-right: Brokerage branding panel */}
          {templateDesign ? (
            /* Template-driven panel */
            <div
              className="relative w-1/2 overflow-hidden"
              style={{
                backgroundColor: templateDesign.background.colorEnabled !== false
                  ? templateDesign.background.color
                  : "transparent",
              }}
            >
              {templateDesign.background.imageUrl && (
                <img
                  src={templateDesign.background.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: templateDesign.background.colorEnabled !== false ? 0.3 : 1 }}
                />
              )}
              {templateDesign.background.colorEnabled !== false && (
                <div className="absolute inset-0" style={{ backgroundColor: templateDesign.background.overlayColor }} />
              )}
              {/* Render elements */}
              {templateDesign.elements.map((el) => {
                // If this is the team_logo placeholder, swap in agent's logo
                const imgSrc = el.placeholder === "team_logo" && teamLogoUrl
                  ? teamLogoUrl
                  : el.src;

                return (
                  <div
                    key={el.id}
                    className="absolute"
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: (el.type === "image" || el.type === "shape") ? `${el.height}%` : "auto",
                      opacity: el.opacity ?? 1,
                    }}
                  >
                    {el.type === "text" && (
                      <p
                        className="break-words whitespace-pre-wrap"
                        style={{
                          fontSize: `${(el.fontSize || 16) * 0.35}px`,
                          color: el.fontColor || "#fff",
                          fontWeight: el.fontWeight || "normal",
                          fontStyle: el.fontStyle || "normal",
                          textAlign: el.textAlign || "left",
                          fontFamily: FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif",
                          lineHeight: el.lineHeight || 1.3,
                          letterSpacing: el.letterSpacing ? `${el.letterSpacing * 0.35}px` : undefined,
                          textTransform: el.textTransform || "none",
                        }}
                      >
                        {el.text}
                      </p>
                    )}
                    {el.type === "image" && imgSrc && (
                      <img
                        src={el.tintColor && imgSrc.startsWith("data:image/svg+xml,") ? recolorSvgDataUri(imgSrc, el.tintColor) : imgSrc}
                        alt=""
                        className="w-full h-full"
                        style={{ objectFit: el.objectFit || "contain" }}
                      />
                    )}
                    {el.type === "shape" && (
                      <div className="w-full h-full" style={{ transform: el.shapeRotation ? `rotate(${el.shapeRotation}deg)` : undefined }}>
                        {el.shapeType === "line" && <div className="w-full absolute top-1/2 -translate-y-1/2" style={{ height: `${el.shapeBorderWidth || 2}px`, backgroundColor: el.shapeColor || "#000" }} />}
                        {el.shapeType === "rectangle" && <div className="w-full h-full" style={{ backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent", border: el.shapeFilled ? "none" : `${(el.shapeBorderWidth || 2) * 0.35}px solid ${el.shapeColor || "#000"}` }} />}
                        {el.shapeType === "circle" && <div className="w-full h-full rounded-full" style={{ backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent", border: el.shapeFilled ? "none" : `${(el.shapeBorderWidth || 2) * 0.35}px solid ${el.shapeColor || "#000"}` }} />}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Auto-render brokerage slogan centered in the panel */}
              {brokerageSlogan && (
                <div className="absolute z-10 inset-0 flex items-center justify-center pointer-events-none px-2">
                  <p
                    className="text-center font-serif italic leading-snug"
                    style={{
                      fontSize: "8px",
                      color: brokerageTextColor || "#FFFFFF",
                    }}
                  >
                    {brokerageSlogan.replace(/\n/g, " ")}
                  </p>
                </div>
              )}
              {/* Disclaimer */}
              {templateDesign.disclaimer && (
                <div className="absolute bottom-0 left-0 right-0 px-[15%] py-1 pointer-events-none">
                  <p className="leading-tight text-center" style={{
                    fontSize: `${(templateDesign.disclaimerStyle?.fontSize || 8) * 0.35}px`,
                    color: templateDesign.disclaimerStyle?.color || "rgba(255,255,255,0.55)",
                    fontFamily: FONT_MAP[templateDesign.disclaimerStyle?.fontFamily || "sans-serif"],
                  }}>
                    {templateDesign.disclaimer}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Fallback: hardcoded panel */
            <div
              className="relative flex w-1/2 flex-col p-2 md:p-3 overflow-hidden"
              style={{ backgroundColor: brandColor }}
            >
              {brokerageBackgroundUrl && (
                <img
                  src={brokerageBackgroundUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-30"
                />
              )}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: overlayColor }}
              />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-2">
                  {brokerageLogoUrl ? (
                    <img
                      src={brokerageLogoUrl}
                      alt={companyName || "Brokerage"}
                      className="h-5 md:h-8 w-auto object-contain"
                    />
                  ) : (
                    <p className="text-[7px] md:text-[9px] font-bold" style={{ color: textColor }}>
                      {companyName || "Your Brokerage"}
                    </p>
                  )}
                </div>
                <div className="my-auto text-center">
                  <p
                    className="text-[17px] md:text-[25px] font-serif italic leading-snug"
                    style={{ color: textColor }}
                  >
                    {brokerageSlogan
                      ? brokerageSlogan.replace(/\n/g, " ")
                      : companyName || "Your Brokerage"}
                  </p>
                </div>
                <div className="mt-auto">
                  <div className="flex items-center gap-0.5 md:gap-1">
                    {displayIcons.map((icon) => (
                      <div
                        key={icon.key}
                        className="h-2 w-2 md:h-3 md:w-3 rounded-sm bg-white/20 flex items-center justify-center"
                      >
                        <span className="text-[3px] md:text-[5px] font-bold" style={{ color: textColor }}>
                          {icon.label}
                        </span>
                      </div>
                    ))}
                    {v.brokerage_info && brokeragePhone && (
                      <p className="text-[4px] md:text-[6px] ml-auto font-medium" style={{ color: `${textColor}E6` }}>
                        {brokeragePhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Fine horizontal line ── */}
        <div className="h-[0.5px] bg-gray-300 w-full" />

        {/* ── Bottom half ── */}
        <div className="flex h-1/2">
          {/* Bottom-left: Agent profile */}
          {agentCardDesign ? (
            /* Agent-designed panel */
            <div
              className="relative w-1/2 overflow-hidden border-r border-gray-200"
              style={{
                backgroundColor: agentCardDesign.background.colorEnabled !== false
                  ? agentCardDesign.background.color
                  : "transparent",
              }}
            >
              {agentCardDesign.background.imageUrl && (
                <img
                  src={agentCardDesign.background.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: agentCardDesign.background.colorEnabled !== false ? 0.3 : 1 }}
                />
              )}
              {agentCardDesign.background.colorEnabled !== false && (
                <div className="absolute inset-0" style={{ backgroundColor: agentCardDesign.background.overlayColor }} />
              )}
              {agentCardDesign.elements.map((el) => (
                <div
                  key={el.id}
                  className="absolute"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: (el.type === "image" || el.type === "shape") ? `${el.height}%` : "auto",
                    opacity: el.opacity ?? 1,
                  }}
                >
                  {el.type === "text" && (
                    <p
                      className="break-words whitespace-pre-wrap"
                      style={{
                        fontSize: `${(el.fontSize || 16) * 0.35}px`,
                        color: el.fontColor || "#000",
                        fontWeight: el.fontWeight || "normal",
                        fontStyle: el.fontStyle || "normal",
                        textAlign: el.textAlign || "left",
                        fontFamily: FONT_MAP[el.fontFamily || "sans-serif"] || "Arial, sans-serif",
                        lineHeight: el.lineHeight || 1.3,
                        letterSpacing: el.letterSpacing ? `${el.letterSpacing * 0.35}px` : undefined,
                        textTransform: el.textTransform || "none",
                      }}
                    >
                      {el.text}
                    </p>
                  )}
                  {el.type === "image" && el.src && (
                    <img
                      src={el.tintColor && el.src.startsWith("data:image/svg+xml,") ? recolorSvgDataUri(el.src, el.tintColor) : el.src}
                      alt=""
                      className="w-full h-full"
                      style={{ objectFit: el.objectFit || "contain" }}
                    />
                  )}
                  {el.type === "shape" && (
                    <div className="w-full h-full" style={{ transform: el.shapeRotation ? `rotate(${el.shapeRotation}deg)` : undefined }}>
                      {el.shapeType === "line" && <div className="w-full absolute top-1/2 -translate-y-1/2" style={{ height: `${el.shapeBorderWidth || 2}px`, backgroundColor: el.shapeColor || "#000" }} />}
                      {el.shapeType === "rectangle" && <div className="w-full h-full" style={{ backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent", border: el.shapeFilled ? "none" : `${(el.shapeBorderWidth || 2) * 0.35}px solid ${el.shapeColor || "#000"}` }} />}
                      {el.shapeType === "circle" && <div className="w-full h-full rounded-full" style={{ backgroundColor: el.shapeFilled ? (el.shapeColor || "#000") : "transparent", border: el.shapeFilled ? "none" : `${(el.shapeBorderWidth || 2) * 0.35}px solid ${el.shapeColor || "#000"}` }} />}
                    </div>
                  )}
                </div>
              ))}
              {/* Seasonal Footer */}
              {seasonTheme && resolvedSeason !== "none" && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden"
                  style={{ height: "12%", background: seasonTheme.gradient }}
                >
                  <div
                    className="absolute inset-0"
                    dangerouslySetInnerHTML={{ __html: seasonTheme.shapes }}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Fallback: hardcoded agent panel */
            <div className="relative flex w-1/2 flex-col p-2 md:p-3 border-r border-gray-200">
              <div className="flex items-start gap-2">
                {/* Headshot */}
                <div
                  className="h-12 w-10 md:h-16 md:w-14 shrink-0 rounded-md border-2 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
                  style={{ borderColor: brandColor }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={agentName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* Contact info */}
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[8px] md:text-[11px] font-bold text-gray-900 leading-tight">
                    {agentName}
                  </p>
                  {tagline && (
                    <p
                      className="text-[4px] md:text-[6px] italic mt-0.5"
                      style={{ color: brandColor }}
                    >
                      {tagline}
                    </p>
                  )}
                  {companyName && (
                    <p className="text-[5px] md:text-[7px] font-semibold text-gray-700 mt-0.5">
                      {companyName}
                    </p>
                  )}
                  {v.phone && phone && (
                    <p className="text-[4px] md:text-[6px] text-gray-500 mt-0.5">
                      {phone}
                    </p>
                  )}
                  {v.email && email && (
                    <p className="text-[3.5px] md:text-[5.5px] text-gray-500">
                      {email}
                    </p>
                  )}
                  {v.website && website && (
                    <p className="text-[3.5px] md:text-[5.5px] text-gray-500">
                      {website}
                    </p>
                  )}
                  {v.license && licenseNumber && (
                    <p className="text-[3.5px] md:text-[5.5px] text-gray-400">
                      {licenseNumber}
                    </p>
                  )}
                </div>

                {/* Team Logo */}
                {teamLogoUrl && (
                  <img
                    src={teamLogoUrl}
                    alt="Team Logo"
                    className="h-8 md:h-12 w-auto object-contain shrink-0 ml-auto"
                  />
                )}
              </div>

              {/* Personal Message */}
              {customMessage && (
                <p className="text-[3.5px] md:text-[5.5px] text-gray-500 leading-snug mt-auto pt-1">
                  {customMessage}
                </p>
              )}

              {/* Seasonal Footer */}
              {seasonTheme && resolvedSeason !== "none" && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden"
                  style={{ height: "12%", background: seasonTheme.gradient }}
                >
                  <div
                    className="absolute inset-0"
                    dangerouslySetInnerHTML={{ __html: seasonTheme.shapes }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Bottom-right: Mailing area */}
          <div className="flex w-1/2 flex-col justify-between p-2 md:p-3 bg-white">
            <div className="flex justify-end">
              <div className="h-5 w-7 md:h-7 md:w-9 border border-dashed border-gray-300 rounded-sm flex items-center justify-center">
                <p className="text-[4px] md:text-[6px] text-gray-400 text-center leading-tight">
                  POSTAGE
                </p>
              </div>
            </div>

            {/* Recipient */}
            <div className="mt-auto">
              <p className="text-[7px] md:text-[10px] font-semibold text-gray-900">
                {recipientName}
              </p>
              {recipientAddress.split("\n").map((line, i) => (
                <p
                  key={i}
                  className="text-[6px] md:text-[9px] text-gray-600"
                >
                  {line}
                </p>
              ))}
            </div>

            {/* Address lines */}
            <div className="mt-1 space-y-0.5">
              <div className="h-[0.5px] bg-gray-300 w-3/4 ml-auto" />
              <div className="h-[0.5px] bg-gray-300 w-3/4 ml-auto" />
              <div className="h-[0.5px] bg-gray-300 w-3/4 ml-auto" />
            </div>

            {/* Footer disclaimer — only shown if brokerage provides one */}
            {brokerageDisclaimer && (
              <p className="text-[3px] md:text-[4.5px] text-gray-400 leading-tight mt-1">
                {brokerageDisclaimer}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
