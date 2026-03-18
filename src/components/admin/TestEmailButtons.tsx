"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";

export function TestEmailButtons() {
  const [to, setTo] = useState("");
  const [sending, setSending] = useState<"reminder" | "final" | null>(null);

  async function sendTest(type: "reminder" | "final") {
    setSending(type);
    try {
      const res = await fetch("/api/email/test-billing-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, to: to || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send");
      }
      const data = await res.json();
      toast.success(`Test email sent to ${data.sent_to}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSending(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Test Billing Reminder Emails
        </CardTitle>
        <CardDescription>
          Send a preview of the billing reminder emails. Leave blank to send to your own email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Override email address (optional)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          type="email"
        />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => sendTest("reminder")}
            disabled={!!sending}
          >
            <Send className="mr-2 h-4 w-4" />
            {sending === "reminder" ? "Sending..." : "Send 18th Reminder"}
          </Button>
          <Button
            variant="outline"
            onClick={() => sendTest("final")}
            disabled={!!sending}
          >
            <Send className="mr-2 h-4 w-4" />
            {sending === "final" ? "Sending..." : "Send Final Reminder (20th)"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
