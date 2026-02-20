import { lobPostcards } from "./client";
import { renderTemplate, buildMergeVariables } from "./templates";
import { resolveHtml, LOB_DIMENSIONS, injectFrontOverlay, renderFullBackHtml } from "./render-design";
import type { PostcardSize } from "@lob/lob-typescript-sdk";

interface CreatePostcardParams {
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
    address_line1?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    license_number?: string | null;
    team_logo_url?: string | null;
    seasonal_footer?: string | null;
    agent_card_design?: Record<string, unknown> | null;
  };
  contact: {
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state: string;
    zip: string;
  };
  template: {
    front_html: string;
    back_html: string;
    size: string;
    type: "monthly" | "brokerage";
    brokerageBackHtml?: string | null;
  };
  offer?: {
    title?: string;
    discount_text?: string;
    merchant_name?: string;
    merchant_address?: string;
    fine_print?: string | null;
    redemption_code?: string | null;
  } | null;
  campaignId: string;
  postcardDbId: string;
  campaignMonth?: number;
}

/**
 * Creates a single postcard via Lob API.
 * Returns the Lob postcard object.
 */
export async function createPostcard({
  agent,
  contact,
  template,
  offer,
  campaignId,
  postcardDbId,
  campaignMonth,
}: CreatePostcardParams) {
  const mergeVars = buildMergeVariables(agent, contact, offer);
  const sizeKey = (template.size || "6x9") as keyof typeof LOB_DIMENSIONS;
  const dims = LOB_DIMENSIONS[sizeKey] || LOB_DIMENSIONS["6x9"];

  // Resolve JSON DesignConfig → print HTML, then apply merge variables
  // Front was designed at 900px basis in the TemplateDesigner
  const agentName = `${agent.first_name} ${agent.last_name}`.trim();
  const frontHtml = injectFrontOverlay(
    renderTemplate(resolveHtml(template.front_html, dims.front, 900), mergeVars),
    agentName,
    agent.company_name
  );

  // Compose full back with all 4 quadrants (brokerage + agent + offer + mailing)
  const rawBackHtml = renderFullBackHtml({
    templateBackHtml: template.back_html,
    templateType: template.type,
    brokerageBackHtml: template.brokerageBackHtml,
    agentCardDesign: agent.agent_card_design,
    agent,
    offer,
    campaignMonth,
    size: template.size,
  });
  const backHtml = renderTemplate(rawBackHtml, mergeVars);

  // Map our sizes to Lob sizes
  const sizeMap: Record<string, PostcardSize> = {
    "4x6": "4x6" as PostcardSize,
    "6x9": "6x9" as PostcardSize,
    "6x11": "6x11" as PostcardSize,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lobPostcard = await lobPostcards.create({
    to: {
      name: `${contact.first_name} ${contact.last_name}`,
      address_line1: contact.address_line1,
      address_line2: contact.address_line2 || undefined,
      address_city: contact.city,
      address_state: contact.state,
      address_zip: contact.zip,
      address_country: "US",
    },
    from: agent.address_line1
      ? {
          name: `${agent.first_name} ${agent.last_name}`,
          address_line1: agent.address_line1,
          address_city: agent.city || "",
          address_state: agent.state || "",
          address_zip: agent.zip || "",
          address_country: "US",
        }
      : undefined,
    front: frontHtml,
    back: backHtml,
    size: sizeMap[template.size] || ("6x9" as PostcardSize),
    use_type: "operational",
    metadata: {
      campaign_id: campaignId,
      postcard_db_id: postcardDbId,
    },
  } as any);

  return lobPostcard;
}

/**
 * Sends postcards in batches of a given size.
 * Returns results for each postcard (success or error).
 */
export async function sendPostcardBatch(
  postcards: CreatePostcardParams[],
  batchSize = 50,
  onProgress?: (completed: number, total: number) => void
): Promise<Array<{ postcardDbId: string; lobId?: string; error?: string }>> {
  const results: Array<{ postcardDbId: string; lobId?: string; error?: string }> = [];

  for (let i = 0; i < postcards.length; i += batchSize) {
    const batch = postcards.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((pc) => createPostcard(pc))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      const pc = batch[j];

      if (result.status === "fulfilled") {
        results.push({
          postcardDbId: pc.postcardDbId,
          lobId: result.value.id,
        });
      } else {
        results.push({
          postcardDbId: pc.postcardDbId,
          error: result.reason?.message || "Unknown error",
        });
      }
    }

    onProgress?.(Math.min(i + batchSize, postcards.length), postcards.length);

    // Small delay between batches to respect rate limits
    if (i + batchSize < postcards.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}
