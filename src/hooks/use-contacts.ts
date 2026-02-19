"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Contact } from "@/types/database";

interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}

interface ContactFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useContacts(filters: ContactFilters = {}) {
  const { status = "all", search = "", page = 1, limit = 50 } = filters;

  return useQuery<ContactsResponse>({
    queryKey: ["contacts", { status, search, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/contacts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create contact");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Partial<Contact> & { id: string }) => {
      const res = await fetch("/api/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update contact");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete contacts");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useRestoreContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Restore by setting status back to "active"
      const results = await Promise.all(
        ids.map((id) =>
          fetch("/api/contacts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: "active" }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) throw new Error("Failed to restore some contacts");
      return { restored: ids.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUploadContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contacts: Record<string, string>[];
      fileName: string;
      columnMapping: Record<string, string>;
    }) => {
      const res = await fetch("/api/contacts/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload contacts");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
