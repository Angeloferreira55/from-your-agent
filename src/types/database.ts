export type Industry = "real_estate";
export type AgentRole = "agent" | "admin";
export type SubscriptionStatus = "inactive" | "active" | "past_due" | "canceled" | "trialing";

export interface PostcardVisibleFields {
  phone: boolean;
  email: boolean;
  license: boolean;
  website: boolean;
  brokerage_info: boolean;
}

export interface AgentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  industry: Industry;
  company_name: string | null;
  license_number: string | null;
  logo_url: string | null;
  photo_url: string | null;
  brokerage_logo_url: string | null;
  team_logo_url: string | null;
  brokerage_phone: string | null;
  brokerage_address_line1: string | null;
  brokerage_address_line2: string | null;
  brokerage_city: string | null;
  brokerage_state: string | null;
  brokerage_zip: string | null;
  website: string | null;
  postcard_visible_fields: PostcardVisibleFields;
  custom_message: string | null;
  tagline: string | null;
  brand_color: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  brokerage_id: string | null;
  role: AgentRole;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export type ContactStatus = "active" | "inactive" | "do_not_mail" | "bad_address";
export type RelationshipType = "sphere" | "past_client" | "prospect" | "referral" | "family" | "friend" | "other";
export type Deliverability = "deliverable" | "deliverable_unnecessary_unit" | "deliverable_incorrect_unit" | "deliverable_missing_unit" | "undeliverable" | "unknown";

export interface Contact {
  id: string;
  agent_id: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  email: string | null;
  phone: string | null;
  relationship_type: RelationshipType;
  tags: string[] | null;
  address_verified: boolean;
  deliverability: Deliverability;
  status: ContactStatus;
  import_batch_id: string | null;
  source: "manual" | "csv_import" | "crm_sync";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MerchantCategory =
  | "restaurant" | "cafe" | "pizza" | "mexican" | "asian" | "italian"
  | "american" | "bbq" | "seafood" | "bakery" | "ice_cream"
  | "bar" | "brewery" | "other_food"
  | "spa" | "salon" | "fitness" | "entertainment" | "retail" | "service";

export interface Merchant {
  id: string;
  name: string;
  category: MerchantCategory;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  region_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  merchant_id: string;
  title: string;
  description: string | null;
  discount_text: string;
  fine_print: string | null;
  valid_from: string;
  valid_until: string;
  redemption_code: string | null;
  redemption_instructions: string | null;
  image_url: string | null;
  featured: boolean;
  max_uses_per_month: number | null;
  region_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  merchants?: Merchant;
}

export type CampaignStatus = "draft" | "scheduled" | "generating" | "ready_to_mail" | "mailing" | "mailed" | "completed" | "canceled";

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  month: number;
  year: number;
  template_id: string;
  offer_ids: string[];
  mail_date: string;
  cutoff_date: string;
  status: CampaignStatus;
  total_postcards: number;
  mailed_count: number;
  delivered_count: number;
  returned_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PostcardStatus = "pending" | "generating" | "rendered" | "queued" | "mailed" | "in_transit" | "in_local_area" | "delivered" | "returned" | "canceled" | "failed";

export interface Postcard {
  id: string;
  agent_campaign_id: string;
  contact_id: string;
  campaign_id: string;
  offer_id: string | null;
  lob_postcard_id: string | null;
  lob_url: string | null;
  merge_variables: Record<string, string> | null;
  mailed: boolean;
  status: PostcardStatus;
  cost_per_card: number | null;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  name: string;
  description: string | null;
  center_lat: number | null;
  center_lng: number | null;
  radius_miles: number;
  state_codes: string[] | null;
  zip_codes: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostcardTemplate {
  id: string;
  name: string;
  description: string | null;
  size: "4x6" | "6x9" | "6x11";
  front_html: string;
  back_html: string;
  front_preview_url: string | null;
  back_preview_url: string | null;
  merge_variables: Array<{ key: string; label: string; required: boolean }>;
  is_default: boolean;
  is_active: boolean;
  season: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  id: string;
  name: string;
  min_cards: number;
  max_cards: number | null;
  price_per_mailed: number;
  price_per_unmailed: number;
  is_active: boolean;
  created_at: string;
}

export interface BillingRecord {
  id: string;
  agent_id: string;
  stripe_invoice_id: string | null;
  campaign_id: string | null;
  description: string;
  total_cards: number;
  mailed_cards: number;
  unmailed_cards: number;
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "paid" | "failed" | "refunded" | "void";
  billing_date: string;
  paid_at: string | null;
  created_at: string;
}
