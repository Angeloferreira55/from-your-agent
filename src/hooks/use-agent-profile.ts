"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AgentProfile } from "@/types/database";

export function useAgentProfile() {
  return useQuery<AgentProfile>({
    queryKey: ["agent-profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      return data.profile;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<AgentProfile>) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-profile"] });
    },
  });
}

export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: "logo" | "photo" | "brokerage_logo" | "team_logo" }) => {
      // Read file as base64 and send as JSON (same as PATCH which works)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _upload: { base64, type, ext, contentType: file.type } }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        console.error("[upload] status:", res.status, "body:", errBody);
        try {
          throw new Error(JSON.parse(errBody).error || `HTTP ${res.status}`);
        } catch {
          throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 200)}`);
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-profile"] });
    },
  });
}
