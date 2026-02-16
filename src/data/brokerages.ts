export interface BrokerageConfig {
  id: string;
  name: string;
  slogan: string;
  website: string;
  logoUrl: string;
  /** Optional second logo (e.g. local franchise) */
  secondLogoUrl?: string;
  /** Background image for the branding area */
  backgroundUrl: string;
  /** Primary brand color */
  brandColor: string;
  /** Overlay color with opacity for text readability */
  overlayColor: string;
  /** Text color on the branded area */
  textColor: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;
  };
  disclaimer: string;
}

export const BROKERAGES: Record<string, BrokerageConfig> = {
  "keller-williams": {
    id: "keller-williams",
    name: "Keller Williams Realty",
    slogan: "Not Just Agents.\nAdvisors.",
    website: "www.kw.com",
    logoUrl: "/brokerages/kw-logo-white.png",
    backgroundUrl: "/brokerages/kw-bg.jpg",
    brandColor: "#B40101",
    overlayColor: "rgba(100, 0, 0, 0.65)",
    textColor: "#FFFFFF",
    socialLinks: {
      facebook: "#",
      instagram: "#",
      linkedin: "#",
      youtube: "#",
    },
    disclaimer:
      "Each office is independently owned and operated. If your home is currently on the market, please don't consider this a solicitation.",
  },
  "coldwell-banker": {
    id: "coldwell-banker",
    name: "Coldwell Banker Legacy",
    slogan: "Market Leaders.\nTrusted Advisors.",
    website: "www.CBLegacy.com",
    logoUrl: "/brokerages/cb-logo-white.png",
    backgroundUrl: "/brokerages/cb-bg.jpg",
    brandColor: "#012169",
    overlayColor: "rgba(1, 33, 105, 0.6)",
    textColor: "#FFFFFF",
    socialLinks: {
      facebook: "#",
      instagram: "#",
      linkedin: "#",
      youtube: "#",
      twitter: "#",
    },
    disclaimer:
      "Each office is independently owned and operated. If your home is currently on the market, please don't consider this a solicitation.",
  },
  "remax": {
    id: "remax",
    name: "RE/MAX",
    slogan: "Nobody Sells More\nReal Estate Than RE/MAX.",
    website: "www.remax.com",
    logoUrl: "/brokerages/remax-logo-white.png",
    backgroundUrl: "/brokerages/remax-bg.jpg",
    brandColor: "#003DA5",
    overlayColor: "rgba(0, 61, 165, 0.6)",
    textColor: "#FFFFFF",
    socialLinks: {
      facebook: "#",
      instagram: "#",
      linkedin: "#",
    },
    disclaimer:
      "Each office is independently owned and operated. If your home is currently on the market, please don't consider this a solicitation.",
  },
  "exp-realty": {
    id: "exp-realty",
    name: "eXp Realty",
    slogan: "Agent-Owned.\nCloud Brokerage.",
    website: "www.exprealty.com",
    logoUrl: "/brokerages/exp-logo-white.png",
    backgroundUrl: "/brokerages/exp-bg.jpg",
    brandColor: "#00223E",
    overlayColor: "rgba(0, 34, 62, 0.65)",
    textColor: "#FFFFFF",
    socialLinks: {
      facebook: "#",
      instagram: "#",
      linkedin: "#",
    },
    disclaimer:
      "Each agent is an independent contractor. If your home is currently on the market, please don't consider this a solicitation.",
  },
  "century-21": {
    id: "century-21",
    name: "Century 21",
    slogan: "Relentless.\nThe Extraordinary Everyday.",
    website: "www.century21.com",
    logoUrl: "/brokerages/c21-logo-white.png",
    backgroundUrl: "/brokerages/c21-bg.jpg",
    brandColor: "#B59A5B",
    overlayColor: "rgba(60, 50, 30, 0.65)",
    textColor: "#FFFFFF",
    socialLinks: {
      facebook: "#",
      instagram: "#",
      linkedin: "#",
    },
    disclaimer:
      "Each office is independently owned and operated. If your home is currently on the market, please don't consider this a solicitation.",
  },
  "berkshire-hathaway": {
    id: "berkshire-hathaway",
    name: "Berkshire Hathaway HomeServices",
    slogan: "Forever Agent.\nGood to Know.",
    website: "www.bhhs.com",
    logoUrl: "/brokerages/bhhs-logo-white.png",
    backgroundUrl: "/brokerages/bhhs-bg.jpg",
    brandColor: "#53284F",
    overlayColor: "rgba(83, 40, 79, 0.65)",
    textColor: "#FFFFFF",
    socialLinks: {
      facebook: "#",
      instagram: "#",
      linkedin: "#",
    },
    disclaimer:
      "Each office is independently owned and operated. If your home is currently on the market, please don't consider this a solicitation.",
  },
  "compass": {
    id: "compass",
    name: "Compass",
    slogan: "Find Your Place\nin the World.",
    website: "www.compass.com",
    logoUrl: "/brokerages/compass-logo-white.png",
    backgroundUrl: "/brokerages/compass-bg.jpg",
    brandColor: "#000000",
    overlayColor: "rgba(0, 0, 0, 0.6)",
    textColor: "#FFFFFF",
    socialLinks: {
      facebook: "#",
      instagram: "#",
      linkedin: "#",
    },
    disclaimer:
      "Compass is a licensed real estate broker. If your home is currently on the market, please don't consider this a solicitation.",
  },
  "sothebys": {
    id: "sothebys",
    name: "Sotheby's International Realty",
    slogan: "Artfully Uniting\nExtraordinary Properties.",
    website: "www.sothebysrealty.com",
    logoUrl: "/brokerages/sothebys-logo-white.png",
    backgroundUrl: "/brokerages/sothebys-bg.jpg",
    brandColor: "#002349",
    overlayColor: "rgba(0, 35, 73, 0.65)",
    textColor: "#FFFFFF",
    socialLinks: {
      facebook: "#",
      instagram: "#",
      linkedin: "#",
    },
    disclaimer:
      "Each office is independently owned and operated. If your home is currently on the market, please don't consider this a solicitation.",
  },
};

/** Get brokerage config by ID, falls back to a generic config */
export function getBrokerage(id: string): BrokerageConfig {
  return (
    BROKERAGES[id] ?? {
      id: "generic",
      name: "Your Brokerage",
      slogan: "Your Trusted\nReal Estate Partner.",
      website: "www.yourbrokerage.com",
      logoUrl: "",
      backgroundUrl: "",
      brandColor: "#1B3A5C",
      overlayColor: "rgba(27, 58, 92, 0.65)",
      textColor: "#FFFFFF",
      disclaimer:
        "If your home is currently on the market, please don't consider this a solicitation.",
    }
  );
}
