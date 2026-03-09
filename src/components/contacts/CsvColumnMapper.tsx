"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface CsvColumnMapperProps {
  csvHeaders: string[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

const CONTACT_FIELDS = [
  { key: "full_name", label: "Full Name (auto-split into first + last)", required: false },
  { key: "first_name", label: "First Name", required: false },
  { key: "last_name", label: "Last Name", required: false },
  { key: "full_address", label: "Full Address (auto-split into street, city, state, ZIP)", required: false },
  { key: "address_line1", label: "Street Address", required: false },
  { key: "address_line2", label: "Address Line 2", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "zip", label: "ZIP Code", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
];

const SKIP_VALUE = "__skip__";

export function CsvColumnMapper({
  csvHeaders,
  mapping,
  onMappingChange,
}: CsvColumnMapperProps) {
  function handleChange(field: string, csvColumn: string) {
    const newMapping = { ...mapping };
    if (csvColumn === SKIP_VALUE) {
      delete newMapping[field];
    } else {
      newMapping[field] = csvColumn;
    }
    onMappingChange(newMapping);
  }

  const requiredFieldsMapped = CONTACT_FIELDS.filter((f) => f.required).every(
    (f) => mapping[f.key]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 bg-muted/50">
        <p className="text-sm font-medium">
          Map your CSV columns to contact fields
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          We auto-detected some mappings. Adjust as needed.
          {!requiredFieldsMapped && (
            <span className="text-destructive ml-1">
              All required fields must be mapped.
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {CONTACT_FIELDS.map((field) => (
          <div key={field.key} className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">{field.label}</Label>
              {field.required && (
                <Badge variant="secondary" className="text-xs">Required</Badge>
              )}
            </div>
            <span className="text-muted-foreground text-xs">maps to</span>
            <Select
              value={mapping[field.key] || SKIP_VALUE}
              onValueChange={(v) => handleChange(field.key, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SKIP_VALUE}>— Skip —</SelectItem>
                {csvHeaders.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
