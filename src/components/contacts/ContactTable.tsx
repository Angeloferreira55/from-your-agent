"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, CheckCircle2, AlertCircle, EyeOff, Eye } from "lucide-react";
import type { Contact } from "@/types/database";

interface ContactTableProps {
  contacts: Contact[];
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (ids: string[]) => void;
  onStatusChange: (contact: Contact, status: string) => void;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  do_not_mail: { label: "Do Not Mail", variant: "outline" },
  bad_address: { label: "Bad Address", variant: "destructive" },
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  sphere: "Sphere",
  past_client: "Past Client",
  prospect: "Prospect",
  referral: "Referral",
  family: "Family",
  friend: "Friend",
  other: "Other",
};

export function ContactTable({
  contacts,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onEdit,
  onDelete,
  onStatusChange,
}: ContactTableProps) {
  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => {
              const statusInfo = STATUS_BADGE[contact.status] || STATUS_BADGE.active;
              return (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={(checked) => onSelectOne(contact.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{contact.address_line1}</div>
                    <div>
                      {contact.city}, {contact.state} {contact.zip}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {contact.email && <div>{contact.email}</div>}
                    {contact.phone && (
                      <div className="text-muted-foreground">{contact.phone}</div>
                    )}
                    {!contact.email && !contact.phone && (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {RELATIONSHIP_LABELS[contact.relationship_type] || contact.relationship_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {contact.address_verified ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(contact)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {contact.status === "active" ? (
                          <DropdownMenuItem onClick={() => onStatusChange(contact, "inactive")}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Mark Inactive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onStatusChange(contact, "active")}>
                            <Eye className="mr-2 h-4 w-4" />
                            Mark Active
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete([contact.id])}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
