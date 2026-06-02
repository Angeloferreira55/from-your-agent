import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplate, buildMergeVariables } from "@/lib/lob/templates";
import { resolveHtml, LOB_DIMENSIONS, injectFrontOverlay, designHasFrontPlaceholders } from "@/lib/lob/render-design";
import type { AgentPlaceholderData } from "@/lib/lob/render-design";

/**
 * GET — Returns the postcard front HTML as text/html, rendered exactly as Lob would print it.
 * Query params: template_id (required), month (optional)
 */
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();

  const url = new URL(req.url);
  const templateId = url.searchParams.get("template_id");
  const previewAgentId = url.searchParams.get("agent_id");
  const debug = url.searchParams.get("debug") === "1";

  if (!templateId) return new NextResponse("template_id is required", { status: 400 });

  // Load current agent profile for auth and admin role checks.
  const { data: currentAgent } = await admin
    .from("agent_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!currentAgent) return new NextResponse("Profile not found", { status: 404 });

  let agent: Record<string, any> | null = null;
  if (previewAgentId) {
    if (currentAgent.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    const { data: targetAgent } = await admin
      .from("agent_profiles")
      .select("*")
      .eq("id", previewAgentId)
      .single();
    if (!targetAgent) return new NextResponse("Agent not found", { status: 404 });
    agent = targetAgent;
  } else {
    const { data: currentAgentFull } = await admin
      .from("agent_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (!currentAgentFull) return new NextResponse("Profile not found", { status: 404 });
    agent = currentAgentFull;
  }

  const { data: template } = await admin
    .from("postcard_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (!template) return new NextResponse("Template not found", { status: 404 });

  // Get an active offer for preview
  const { data: offers } = await admin
    .from("offers")
    .select("*, merchants (*)")
    .eq("is_active", true)
    .limit(1);

  const offer = offers?.[0]
    ? {
        title: offers[0].title,
        discount_text: offers[0].discount_text,
        merchant_name: offers[0].merchants?.name || "",
        merchant_address: offers[0].merchants
          ? `${offers[0].merchants.city || ""}, ${offers[0].merchants.state || ""}`
          : "",
        fine_print: offers[0].fine_print,
        redemption_code: offers[0].redemption_code,
      }
    : null;

  const dummyContact = {
    first_name: "Jane", last_name: "Doe",
    address_line1: "123 Main St", city: "Anytown", state: "NM", zip: "87109",
  };

  const sizeKey = (template.size || "6x9") as keyof typeof LOB_DIMENSIONS;
  const dims = LOB_DIMENSIONS[sizeKey] || LOB_DIMENSIONS["6x9"];

  const mergeVars = buildMergeVariables(agent, dummyContact, offer);
  const agentName = `${agent.first_name} ${agent.last_name}`.trim();
  const hasPlaceholders = designHasFrontPlaceholders(template.front_html);

  const agentData: AgentPlaceholderData = {
    agent_name: agentName,
    brokerage_name: agent.company_name || undefined,
    brokerage_logo_url: undefined,
    agent_phone: agent.phone || undefined,
  };

  const resolvedFront = renderTemplate(
    resolveHtml(template.front_html, dims.front, 900, hasPlaceholders ? agentData : undefined),
    mergeVars
  );

  const frontHtml = hasPlaceholders
    ? resolvedFront
    : injectFrontOverlay(resolvedFront, agentName, agent.company_name, dims.front.width, null);

  // Wrap in a scaled container for iframe display
  const bodyWidthIn = (dims.front.width / 300).toFixed(4);
  const bodyHeightIn = (dims.front.height / 300).toFixed(4);

  const bodyMatch = frontHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : frontHtml;
  const bodyStyleMatch = frontHtml.match(/<body\s+style="([^"]*)"/i);
  const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : "";
  const debugOverlay = debug ? `<div style="position:absolute;top:0;left:0;right:0;padding:0.4rem 0.6rem;z-index:999;background:rgba(0,0,0,0.75);color:#fff;font-size:12px;font-family:Arial,sans-serif;line-height:1.2">previewAgentId=${previewAgentId || "self"} | currentUser=${currentAgent.id}(${currentAgent.role}) | agent=${agent.first_name} ${agent.last_name}(${agent.id})</div>` : "";

  // Use CSS zoom instead of transform for more reliable iframe scaling
  const html = `<!DOCTYPE html>
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
    ${debugOverlay}${bodyContent}
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
