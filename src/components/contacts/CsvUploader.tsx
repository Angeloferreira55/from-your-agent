"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseCSV, type ParseResult } from "@/lib/csv/parser";
import { toast } from "sonner";

interface CsvUploaderProps {
  onParsed: (result: ParseResult, file: File) => void;
}

export function CsvUploader({ onParsed }: CsvUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);

  const handleFile = useCallback(
    async (f: File) => {
      if (!f.name.endsWith(".csv") && f.type !== "text/csv") {
        toast.error("Please upload a CSV file");
        return;
      }

      setFile(f);
      setParsing(true);

      try {
        const result = await parseCSV(f);
        if (result.rowCount === 0) {
          toast.error("The CSV file is empty");
          setFile(null);
          return;
        }
        onParsed(result, f);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to parse CSV");
        setFile(null);
      } finally {
        setParsing(false);
      }
    },
    [onParsed]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
        dragOver
          ? "border-orange-400 bg-orange-50"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      }`}
    >
      {file ? (
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-green-600" />
          <div className="text-left">
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {parsing ? "Parsing..." : "Ready"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drag and drop your CSV file here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click below to browse
          </p>
          <label>
            <Button variant="outline" className="mt-4" asChild>
              <span>
                Choose File
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </span>
            </Button>
          </label>
          <p className="mt-4 text-xs text-muted-foreground">
            Required columns: First Name, Last Name, Address, City, State, ZIP
          </p>
        </>
      )}
    </div>
  );
}
