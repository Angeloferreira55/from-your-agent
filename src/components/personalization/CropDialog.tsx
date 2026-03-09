"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CropDialogProps {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onCropped: (file: File) => void;
  aspect?: number;
  shape?: "rect" | "round";
}

async function getCroppedBlob(
  imageSrc: string,
  crop: Area,
  mimeType: string = "image/jpeg"
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    // No crossOrigin needed for blob URLs — setting it causes canvas taint errors
    img.src = imageSrc;
  });

  // Scale up to print quality: 3× ensures ≥300dpi for typical postcard logo areas.
  // Also respect the source image's natural resolution — don't upscale beyond it.
  const PRINT_SCALE = Math.min(3, image.naturalWidth / crop.width, image.naturalHeight / crop.height);
  const outW = Math.round(crop.width * PRINT_SCALE);
  const outH = Math.round(crop.height * PRINT_SCALE);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;

  // For PNG transparency, don't fill background
  if (mimeType !== "image/png") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, outW, outH);
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      mimeType,
      mimeType === "image/jpeg" ? 0.92 : undefined
    );
  });
}

export function CropDialog({
  file,
  open,
  onClose,
  onCropped,
  aspect = 1,
  shape = "rect",
}: CropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  // Stable blob URL — only recreated when file changes
  const imageUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  // Clean up blob URL when file changes or component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels || !file || !imageUrl) return;
    setProcessing(true);
    try {
      // Preserve PNG for transparency support
      const isPng = file.type === "image/png";
      const mimeType = isPng ? "image/png" : "image/jpeg";
      const ext = isPng ? "png" : "jpg";
      const blob = await getCroppedBlob(imageUrl, croppedAreaPixels, mimeType);
      const croppedFile = new File([blob], `cropped.${ext}`, {
        type: mimeType,
      });
      onCropped(croppedFile);
    } catch (err) {
      console.error("[CropDialog] crop failed:", err);
      // Fall back to original file if crop fails
      onCropped(file);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  if (!file || !imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="relative h-64 w-full overflow-hidden rounded-md bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={shape}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#E8733A]"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            className="bg-[#E8733A] hover:bg-[#CF6430]"
            onClick={handleCrop}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Crop & Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
