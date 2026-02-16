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
  crop: Area
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    // No crossOrigin needed for blob URLs — setting it causes canvas taint errors
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/jpeg",
      0.92
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
      const blob = await getCroppedBlob(imageUrl, croppedAreaPixels);
      const croppedFile = new File([blob], `cropped.jpg`, {
        type: "image/jpeg",
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
            className="w-full accent-[#C02646]"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            className="bg-[#C02646] hover:bg-[#A01E38]"
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
