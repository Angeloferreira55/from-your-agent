"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactTable } from "@/components/contacts/ContactTable";
import { ContactForm } from "@/components/contacts/ContactForm";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContacts, useRestoreContacts } from "@/hooks/use-contacts";
import { Upload, Plus, Users, Search, Trash2, Archive, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { Contact } from "@/types/database";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  const { data, isLoading } = useContacts({
    search: search.length >= 2 ? search : "",
    status: statusFilter,
    page,
  });
  const { data: trashData } = useContacts({ status: "inactive", limit: 50 });
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContacts = useDeleteContacts();
  const restoreContacts = useRestoreContacts();

  const contacts = data?.contacts || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 50);
  const deletedContacts: Contact[] = trashData?.contacts || [];

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleSelectOne(id: string, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  }

  function handleEdit(contact: Contact) {
    setEditingContact(contact);
    setFormOpen(true);
  }

  async function handleFormSubmit(data: Partial<Contact>) {
    if (editingContact) {
      await updateContact.mutateAsync({ ...data, id: editingContact.id } as Contact & { id: string });
      toast.success("Contact updated");
    } else {
      await createContact.mutateAsync(data);
      toast.success("Contact added");
    }
  }

  async function handleDelete(ids: string[]) {
    if (!confirm(`Move ${ids.length} contact(s) to trash?`)) return;
    await deleteContacts.mutateAsync(ids);
    setSelectedIds(new Set());
    toast.success(`${ids.length} contact(s) moved to trash`);
  }

  async function handleRestore(ids: string[]) {
    await restoreContacts.mutateAsync(ids);
    toast.success(`${ids.length} contact(s) restored`);
  }

  // Empty state
  if (!isLoading && total === 0 && !search && statusFilter === "all") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">
              Manage your client list
            </p>
          </div>
        </div>
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No contacts yet</CardTitle>
            <CardDescription>
              Upload your contact database via CSV or add contacts manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3 pb-8">
            <Link href="/dashboard/contacts/upload">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setEditingContact(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Manually
            </Button>
          </CardContent>
        </Card>

        <ContactForm
          open={formOpen}
          onOpenChange={setFormOpen}
          contact={editingContact}
          onSubmit={handleFormSubmit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            {total} contact{total !== 1 ? "s" : ""} in your database
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showTrash ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTrash(!showTrash)}
          >
            <Archive className="mr-2 h-4 w-4" />
            Trash{deletedContacts.length > 0 ? ` (${deletedContacts.length})` : ""}
          </Button>
          <Link href="/dashboard/contacts/upload">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          </Link>
          <Button
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => {
              setEditingContact(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Trash section */}
      {showTrash && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Deleted Contacts
            </CardTitle>
            <CardDescription>
              {deletedContacts.length} deleted contact{deletedContacts.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          {deletedContacts.length > 0 && (
            <CardContent>
              <Table>
                <TableBody>
                  {deletedContacts.map((contact) => (
                    <TableRow key={contact.id} className="opacity-70">
                      <TableCell className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contact.email || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contact.city}{contact.state ? `, ${contact.state}` : ""}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore([contact.id])}
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="do_not_mail">Do Not Mail</SelectItem>
            <SelectItem value="bad_address">Bad Address</SelectItem>
          </SelectContent>
        </Select>

        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(Array.from(selectedIds))}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Table */}
      <ContactTable
        contacts={contacts}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ContactForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        contact={editingContact}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
