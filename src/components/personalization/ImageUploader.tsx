"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CropDialog } from "./CropDialog";

interface ImageUploaderProps {
  label: string;
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMb?: number;
  className?: string;
  shape?: "square" | "circle";
}

export function ImageUploader({
  label,
  currentUrl,
  onUpload,
  accept = "image/png,image/jpeg,image/webp",
  maxSizeMb = 2,
  className,
  shape = "square",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File must be under ${maxSizeMb}MB`);
      return;
    }

    const validTypes = accept.split(",").map((t) => t.trim());
    if (!validTypes.includes(file.type)) {
      setError("Invalid file type");
      return;
    }

    // Open crop dialog instead of uploading immediately
    setFileToCrop(file);
    setCropOpen(true);
  }, [accept, maxSizeMb]);

  const handleCropped = useCallback(async (croppedFile: File) => {
    setCropOpen(false);
    setFileToCrop(null);
    setUploading(true);
    try {
      await onUpload(croppedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleCropClose = useCallback(() => {
    setCropOpen(false);
    setFileToCrop(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [handleFile]);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">{label}</p>
      <div
        className={cn(
          "relative flex items-center justify-center border-2 border-dashed transition-colors cursor-pointer overflow-hidden",
          shape === "circle" ? "h-28 w-28 rounded-full" : "h-28 rounded-lg",
          dragOver ? "border-[#E8733A] bg-[#FFF5EE]" : "border-muted-foreground/25 hover:border-[#E8733A]/50",
          uploading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => { if (!cropOpen) inputRef.current?.click(); }}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt={label}
              className={cn(
                "h-full w-full object-cover",
                shape === "circle" ? "rounded-full" : "rounded-lg"
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              <Upload className="h-5 w-5 text-white" />
            </div>
          </>
        ) : (
          <div className="text-center p-2">
            {uploading ? (
              <Loader2 className="mx-auto h-6 w-6 text-[#E8733A] animate-spin" />
            ) : (
              <>
                <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Drop or click
                </p>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <CropDialog
        file={fileToCrop}
        open={cropOpen}
        onClose={handleCropClose}
        onCropped={handleCropped}
        aspect={1}
        shape={shape === "circle" ? "round" : "rect"}
      />
    </div>
  );
}
