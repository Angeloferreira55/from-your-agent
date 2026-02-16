"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Campaign } from "@/types/database";

export function useAgentCampaigns() {
  return useQuery<(Campaign & { postcard_templates?: { name: string }; agent_campaigns?: { id: string; opted_in: boolean; contact_count: number }[] })[]>({
    queryKey: ["agent-campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/agent/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json();
      return data.campaigns;
    },
  });
}

export function useOptInCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, contactIds }: { campaignId: string; contactIds: string[] }) => {
      const res = await fetch("/api/agent/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, contact_ids: contactIds }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-campaigns"] });
    },
  });
}

export function useOptOutCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch("/api/agent/campaigns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-campaigns"] });
    },
  });
}
