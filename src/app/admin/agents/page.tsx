export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";

export default async function AdminAgentsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: agents } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("role", "agent")
    .order("created_at", { ascending: false });

  // Get contact counts per agent
  const contactCountMap: Record<string, number> = {};
  for (const agent of agents || []) {
    const { count } = await admin
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agent.id)
      .eq("status", "active");
    contactCountMap[agent.id] = count || 0;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground">
          {agents?.length || 0} registered agent{(agents?.length || 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {(!agents || agents.length === 0) ? (
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No agents yet</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Agents will appear here once they sign up.
            </p>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">
                    {agent.first_name} {agent.last_name}
                  </TableCell>
                  <TableCell className="text-sm">{agent.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {agent.company_name || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      agent.subscription_status === "active" ? "default" :
                      agent.subscription_status === "past_due" ? "destructive" : "secondary"
                    }>
                      {agent.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {contactCountMap[agent.id] || 0}
                  </TableCell>
                  <TableCell>
                    {agent.onboarding_completed ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complete</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(agent.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
