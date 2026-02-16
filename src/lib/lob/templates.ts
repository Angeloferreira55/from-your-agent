/**
 * Renders an HTML template by replacing merge variables with actual values.
 */
export function renderTemplate(
  html: string,
  variables: Record<string, string>
): string {
  let rendered = html;
  for (const [key, value] of Object.entries(variables)) {
    // Replace {{key}} patterns
    rendered = rendered.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      escapeHtml(value)
    );
  }
  return rendered;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Builds the merge variables map for a postcard from agent + offer + contact data.
 */
export function buildMergeVariables(
  agent: {
    first_name: string;
    last_name: string;
    company_name?: string | null;
    phone?: string | null;
    email: string;
    tagline?: string | null;
    custom_message?: string | null;
    photo_url?: string | null;
    logo_url?: string | null;
    brand_color?: string;
  },
  contact: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state: string;
    zip: string;
  },
  offer?: {
    title?: string;
    discount_text?: string;
    merchant_name?: string;
    merchant_address?: string;
    fine_print?: string | null;
    redemption_code?: string | null;
  } | null
): Record<string, string> {
  const recipientAddress = [
    contact.address_line1,
    contact.address_line2,
    `${contact.city}, ${contact.state} ${contact.zip}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    agent_name: `${agent.first_name} ${agent.last_name}`,
    agent_company: agent.company_name || "",
    agent_phone: agent.phone || "",
    agent_email: agent.email,
    agent_tagline: agent.tagline || "",
    agent_message: agent.custom_message || "",
    agent_photo_url: agent.photo_url || "",
    agent_logo_url: agent.logo_url || "",
    agent_brand_color: agent.brand_color || "#ea580c",
    recipient_name: `${contact.first_name} ${contact.last_name}`,
    recipient_address: recipientAddress,
    offer_title: offer?.title || "",
    discount_text: offer?.discount_text || "",
    merchant_name: offer?.merchant_name || "",
    merchant_address: offer?.merchant_address || "",
    fine_print: offer?.fine_print || "",
    redemption_code: offer?.redemption_code || "",
  };
}
