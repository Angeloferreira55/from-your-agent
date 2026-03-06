export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Send, Mail, TrendingUp, Camera, Image, MessageSquare, Upload, Settings, UserPlus, Printer } from "lucide-react";
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
                  {!profile?.photo_url && (
                    <li>
                      <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 hover:underline">
                        <Camera className="h-3.5 w-3.5" /> Upload your headshot
                      </Link>
                    </li>
                  )}
                  {!profile?.logo_url && (
                    <li>
                      <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 hover:underline">
                        <Image className="h-3.5 w-3.5" /> Upload your logo
                      </Link>
                    </li>
                  )}
                  {!profile?.custom_message && (
                    <li>
                      <Link href="/dashboard/personalization" className="inline-flex items-center gap-1.5 hover:underline">
                        <MessageSquare className="h-3.5 w-3.5" /> Set your custom message
                      </Link>
                    </li>
                  )}
                  {(contactCount ?? 0) === 0 && (
                    <li>
                      <Link href="/dashboard/contacts/upload" className="inline-flex items-center gap-1.5 hover:underline">
                        <Upload className="h-3.5 w-3.5" /> Upload your contact database
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dashboard/settings" className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" /> Edit Profile
              </Link>
              <Link href="/dashboard/contacts/upload" className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors">
                <UserPlus className="h-4 w-4 text-muted-foreground" /> Add Contacts
              </Link>
              <Link href="/dashboard/campaigns" className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors">
                <Send className="h-4 w-4 text-muted-foreground" /> Campaigns
              </Link>
              <Link href="/dashboard/order-prints" className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium hover:bg-muted transition-colors">
                <Printer className="h-4 w-4 text-muted-foreground" /> Order Prints
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
