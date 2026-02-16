export const dynamic = "force-dynamic";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("agent_profiles")
    .select("first_name, last_name, email, company_name")
    .eq("user_id", user?.id ?? "")
    .single();

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-6">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            {profile?.first_name} {profile?.last_name}
            {profile?.company_name && (
              <span className="ml-1 text-xs">({profile.company_name})</span>
            )}
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
