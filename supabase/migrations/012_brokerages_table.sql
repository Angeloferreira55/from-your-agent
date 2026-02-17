-- Create brokerages table for admin-managed brokerage profiles
CREATE TABLE IF NOT EXISTS public.brokerages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slogan TEXT DEFAULT '',
  website TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  second_logo_url TEXT,
  background_url TEXT DEFAULT '',
  brand_color TEXT DEFAULT '#1B3A5C',
  overlay_color TEXT DEFAULT 'rgba(27, 58, 92, 0.65)',
  text_color TEXT DEFAULT '#FFFFFF',
  social_links JSONB DEFAULT '{}',
  disclaimer TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with existing brokerage data
INSERT INTO public.brokerages (id, name, slogan, website, logo_url, background_url, brand_color, overlay_color, text_color, social_links, disclaimer) VALUES
  ('keller-williams', 'Keller Williams Realty', E'Not Just Agents.\nAdvisors.', 'www.kw.com', '/brokerages/kw-logo-white.png', '/brokerages/kw-bg.jpg', '#B40101', 'rgba(100, 0, 0, 0.65)', '#FFFFFF', '{"facebook":"#","instagram":"#","linkedin":"#","youtube":"#"}', 'Each office is independently owned and operated. If your home is currently on the market, please don''t consider this a solicitation.'),
  ('coldwell-banker', 'Coldwell Banker Legacy', E'Market Leaders.\nTrusted Advisors.', 'www.CBLegacy.com', '/brokerages/cb-logo-white.png', '/brokerages/cb-bg.jpg', '#012169', 'rgba(1, 33, 105, 0.6)', '#FFFFFF', '{"facebook":"#","instagram":"#","linkedin":"#","youtube":"#","twitter":"#"}', 'Each office is independently owned and operated. If your home is currently on the market, please don''t consider this a solicitation.'),
  ('remax', 'RE/MAX', E'Nobody Sells More\nReal Estate Than RE/MAX.', 'www.remax.com', '/brokerages/remax-logo-white.png', '/brokerages/remax-bg.jpg', '#003DA5', 'rgba(0, 61, 165, 0.6)', '#FFFFFF', '{"facebook":"#","instagram":"#","linkedin":"#"}', 'Each office is independently owned and operated. If your home is currently on the market, please don''t consider this a solicitation.'),
  ('exp-realty', 'eXp Realty', E'Agent-Owned.\nCloud Brokerage.', 'www.exprealty.com', '/brokerages/exp-logo-white.png', '/brokerages/exp-bg.jpg', '#00223E', 'rgba(0, 34, 62, 0.65)', '#FFFFFF', '{"facebook":"#","instagram":"#","linkedin":"#"}', 'Each agent is an independent contractor. If your home is currently on the market, please don''t consider this a solicitation.'),
  ('century-21', 'Century 21', E'Relentless.\nThe Extraordinary Everyday.', 'www.century21.com', '/brokerages/c21-logo-white.png', '/brokerages/c21-bg.jpg', '#B59A5B', 'rgba(60, 50, 30, 0.65)', '#FFFFFF', '{"facebook":"#","instagram":"#","linkedin":"#"}', 'Each office is independently owned and operated. If your home is currently on the market, please don''t consider this a solicitation.'),
  ('berkshire-hathaway', 'Berkshire Hathaway HomeServices', E'Forever Agent.\nGood to Know.', 'www.bhhs.com', '/brokerages/bhhs-logo-white.png', '/brokerages/bhhs-bg.jpg', '#53284F', 'rgba(83, 40, 79, 0.65)', '#FFFFFF', '{"facebook":"#","instagram":"#","linkedin":"#"}', 'Each office is independently owned and operated. If your home is currently on the market, please don''t consider this a solicitation.'),
  ('compass', 'Compass', E'Find Your Place\nin the World.', 'www.compass.com', '/brokerages/compass-logo-white.png', '/brokerages/compass-bg.jpg', '#000000', 'rgba(0, 0, 0, 0.6)', '#FFFFFF', '{"facebook":"#","instagram":"#","linkedin":"#"}', 'Compass is a licensed real estate broker. If your home is currently on the market, please don''t consider this a solicitation.'),
  ('sothebys', 'Sotheby''s International Realty', E'Artfully Uniting\nExtraordinary Properties.', 'www.sothebysrealty.com', '/brokerages/sothebys-logo-white.png', '/brokerages/sothebys-bg.jpg', '#002349', 'rgba(0, 35, 73, 0.65)', '#FFFFFF', '{"facebook":"#","instagram":"#","linkedin":"#"}', 'Each office is independently owned and operated. If your home is currently on the market, please don''t consider this a solicitation.')
ON CONFLICT (id) DO NOTHING;

-- Add brokerage_id to agent_profiles
ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS brokerage_id TEXT REFERENCES public.brokerages(id);

-- Create storage bucket for brokerage assets
INSERT INTO storage.buckets (id, name, public) VALUES ('brokerage-assets', 'brokerage-assets', true) ON CONFLICT DO NOTHING;
