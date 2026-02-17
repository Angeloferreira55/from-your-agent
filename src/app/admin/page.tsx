export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Tag, Send, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: agentCount } = await supabase
    .from("agent_profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "agent");

  const { count: offerCount } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: campaignCount } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true });

  const { count: postcardCount } = await supabase
    .from("postcards")
    .select("*", { count: "exact", head: true });

  const stats = [
    { title: "Total Agents", value: agentCount ?? 0, icon: Users },
    { title: "Active Offers", value: offerCount ?? 0, icon: Tag },
    { title: "Campaigns", value: campaignCount ?? 0, icon: Send },
    { title: "Postcards Sent", value: postcardCount ?? 0, icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage offers, campaigns, and agents.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
