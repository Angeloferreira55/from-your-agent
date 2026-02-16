"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CsvUploader } from "@/components/contacts/CsvUploader";
import { CsvColumnMapper } from "@/components/contacts/CsvColumnMapper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUploadContacts } from "@/hooks/use-contacts";
import { autoMapColumns, applyColumnMapping, type ParseResult } from "@/lib/csv/parser";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Step = "upload" | "map" | "review" | "done";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  total: number;
}

export default function UploadContactsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [csvData, setCsvData] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const uploadContacts = useUploadContacts();

  function handleParsed(result: ParseResult, file: File) {
    setCsvData(result);
    setFileName(file.name);
    const autoMapping = autoMapColumns(result.headers);
    setMapping(autoMapping);
    setStep("map");
  }

  const requiredFields = ["first_name", "last_name", "address_line1", "city", "state", "zip"];
  const allRequiredMapped = requiredFields.every((f) => mapping[f]);

  async function handleImport() {
    if (!csvData) return;

    const mappedContacts = applyColumnMapping(csvData.data, mapping);

    try {
      const result = await uploadContacts.mutateAsync({
        contacts: mappedContacts,
        fileName,
        columnMapping: mapping,
      });
      setImportResult(result);
      setStep("done");
      toast.success(`${result.imported} contacts imported!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  }

  // Preview data using the current mapping
  const previewData = csvData
    ? applyColumnMapping(csvData.data.slice(0, 5), mapping)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Contacts</h1>
          <p className="text-muted-foreground">
            Import your contact database from a CSV file
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {[
          { key: "upload", label: "Upload" },
          { key: "map", label: "Map Columns" },
          { key: "review", label: "Review" },
          { key: "done", label: "Done" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-border" />}
            <Badge
              variant={
                step === s.key
                  ? "default"
                  : ["upload", "map", "review", "done"].indexOf(step) >
                    ["upload", "map", "review", "done"].indexOf(s.key)
                  ? "secondary"
                  : "outline"
              }
              className={step === s.key ? "bg-orange-600" : ""}
            >
              {s.label}
            </Badge>
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file with your contacts. We&apos;ll auto-detect the columns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CsvUploader onParsed={handleParsed} />
          </CardContent>
        </Card>
      )}

      {/* Step: Map */}
      {step === "map" && csvData && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              We found {csvData.rowCount} rows and {csvData.headers.length} columns.
              Map them to the correct fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CsvColumnMapper
              csvHeaders={csvData.headers}
              mapping={mapping}
              onMappingChange={setMapping}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                disabled={!allRequiredMapped}
                onClick={() => setStep("review")}
              >
                Review Import
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Review */}
      {step === "review" && csvData && (
        <Card>
          <CardHeader>
            <CardTitle>Review Import</CardTitle>
            <CardDescription>
              Preview of the first 5 contacts out of {csvData.rowCount} total.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>ZIP</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {row.first_name} {row.last_name}
                      </TableCell>
                      <TableCell>{row.address_line1}</TableCell>
                      <TableCell>{row.city}</TableCell>
                      <TableCell>{row.state}</TableCell>
                      <TableCell>{row.zip}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.email || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.phone || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium">Ready to import</p>
              <p className="text-sm text-muted-foreground">
                {csvData.rowCount} contacts will be imported from{" "}
                <strong>{fileName}</strong>
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("map")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                disabled={uploadContacts.isPending}
                onClick={handleImport}
              >
                {uploadContacts.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Import {csvData.rowCount} Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Done */}
      {step === "done" && importResult && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Import Complete!</CardTitle>
            <CardDescription>
              Your contacts have been imported successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold text-green-600">
                  {importResult.imported}
                </p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold text-amber-600">
                  {importResult.skipped}
                </p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-bold text-red-600">
                  {importResult.errors}
                </p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>

            {importResult.errors > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium text-red-800">
                    {importResult.errors} rows had errors (missing required fields)
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => router.push("/dashboard/contacts")}
              >
                View Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
