export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Send, Mail, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .single();

  const { count: contactCount } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", profile?.id ?? "");

  const { count: campaignCount } = await supabase
    .from("agent_campaigns")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", profile?.id ?? "");

  const stats = [
    {
      title: "Total Contacts",
      value: contactCount ?? 0,
      icon: Users,
      description: "In your database",
    },
    {
      title: "Active Campaigns",
      value: campaignCount ?? 0,
      icon: Send,
      description: "This month",
    },
    {
      title: "Postcards Sent",
      value: 0,
      icon: Mail,
      description: "All time",
    },
    {
      title: "Referral Rate",
      value: "—",
      icon: TrendingUp,
      description: "Last 30 days",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile?.first_name || "Agent"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your relationship marketing activity.
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
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Campaign</CardTitle>
            <CardDescription>Next month&apos;s postcard details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No upcoming campaigns yet. Check back soon!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!profile?.onboarding_completed && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <p className="text-sm font-medium text-orange-800">
                  Complete your setup
                </p>
                <ul className="mt-2 space-y-1 text-sm text-orange-700">
                  {!profile?.photo_url && <li>Upload your headshot</li>}
                  {!profile?.logo_url && <li>Upload your logo</li>}
                  {!profile?.custom_message && <li>Set your custom message</li>}
                  {(contactCount ?? 0) === 0 && <li>Upload your contact database</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
