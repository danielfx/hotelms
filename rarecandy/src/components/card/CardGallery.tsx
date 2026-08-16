"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
interface CardGalleryProps {
  image: string;
  name: string;
}

export function CardGallery({ image, name }: CardGalleryProps) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <>
      <div
        className="relative aspect-[3/4] bg-surface border border-border cursor-zoom-in group"
        onClick={() => setZoomed(true)}
      >
        <Image
          src={image}
          alt={name}
          fill
          priority
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute bottom-3 right-3 p-2 bg-ink/80 text-cream opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4" />
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-[100] bg-ink/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <div className="relative w-full max-w-lg aspect-[3/4]">
            <Image
              src={image}
              alt={name}
              fill
              className="object-contain"
              sizes="512px"
            />
          </div>
        </div>
      )}
    </>
  );
}
