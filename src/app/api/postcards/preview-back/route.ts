import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderAgentPanelHtml, renderFullBackHtml, LOB_DIMENSIONS } from "@/lib/lob/render-design";

/**
 * GET — Returns postcard back HTML as text/html.
 *
 * Without query params: renders ONLY the agent panel (bottom-left quadrant)
 *   → used on the Personalization page preview
 *
 * With ?template_id=XXX&month=N: renders the FULL postcard back (all 4 quadrants)
 *   → used on the Campaigns page preview — shows EXACTLY what Lob will print
 */
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();

  const { data: agent } = await admin
    .from("agent_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!agent) return new NextResponse("Profile not found", { status: 404 });

  const url = new URL(req.url);
  const templateId = url.searchParams.get("template_id");
  const monthParam = url.searchParams.get("month");
  const campaignMonth = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;

  let html: string;

  if (templateId) {
    // ── Full back rendering (all 4 quadrants) ──
    const { data: template } = await admin
      .from("postcard_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (!template) return new NextResponse("Template not found", { status: 404 });

    // Fetch brokerage template if monthly
    let brokerageBackHtml: string | null = null;
    if (template.type === "monthly" && agent.brokerage_id) {
      const { data: brokerageTemplate } = await admin
        .from("postcard_templates")
        .select("back_html")
        .eq("type", "brokerage")
        .eq("brokerage_id", agent.brokerage_id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      brokerageBackHtml = brokerageTemplate?.back_html || null;
    }

    const rawBackHtml = renderFullBackHtml({
      templateBackHtml: template.back_html,
      templateType: template.type,
      brokerageBackHtml,
      agentCardDesign: agent.agent_card_design,
      agent: {
        first_name: agent.first_name,
        last_name: agent.last_name,
        company_name: agent.company_name,
        phone: agent.phone,
        email: agent.email,
        tagline: agent.tagline,
        custom_message: agent.custom_message,
        photo_url: agent.photo_url,
        logo_url: agent.logo_url,
        brand_color: agent.brand_color,
        license_number: agent.license_number,
        team_logo_url: agent.team_logo_url,
        seasonal_footer: agent.seasonal_footer,
      },
      campaignMonth,
      size: template.size || "6x9",
    });

    // Wrap in a scaled container so it fits the iframe
    const sizeKey = (template.size || "6x9") as keyof typeof LOB_DIMENSIONS;
    const dims = LOB_DIMENSIONS[sizeKey] || LOB_DIMENSIONS["6x9"];
    const bodyWidthIn = (dims.back.width / 300).toFixed(4);
    const bodyHeightIn = (dims.back.height / 300).toFixed(4);

    // The rawBackHtml is a full document — extract body content
    const bodyMatch = rawBackHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : rawBackHtml;
    const bodyStyleMatch = rawBackHtml.match(/<body\s+style="([^"]*)"/i);
    const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : "";

    html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  html, body { margin:0; padding:0; overflow:hidden; width:100%; height:100%; }
  #container {
    ${bodyStyle}
    width: ${bodyWidthIn}in;
    height: ${bodyHeightIn}in;
    position: relative;
    overflow: hidden;
    transform-origin: top left;
  }
</style>
<script>
  function fit() {
    var c = document.getElementById('container');
    var bw = ${bodyWidthIn} * 96;
    var bh = ${bodyHeightIn} * 96;
    var pw = document.documentElement.clientWidth || window.innerWidth;
    var ph = document.documentElement.clientHeight || window.innerHeight;
    var s = Math.min(pw / bw, ph / bh);
    c.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('load', fit);
  window.addEventListener('resize', fit);
</script>
</head>
<body>
  <div id="container">
    ${bodyContent}
  </div>
</body>
</html>`;
  } else {
    // ── Agent panel only (personalization page) ──
    html = renderAgentPanelHtml({
      agentCardDesign: agent.agent_card_design,
      agent: {
        first_name: agent.first_name,
        last_name: agent.last_name,
        company_name: agent.company_name,
        phone: agent.phone,
        email: agent.email,
        tagline: agent.tagline,
        custom_message: agent.custom_message,
        photo_url: agent.photo_url,
        logo_url: agent.logo_url,
        brand_color: agent.brand_color,
        license_number: agent.license_number,
        team_logo_url: agent.team_logo_url,
        seasonal_footer: agent.seasonal_footer,
      },
      campaignMonth,
      size: "6x9",
    });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
