"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ImageDef {
  src: string;
  style?: React.CSSProperties;
}

interface ImageCarouselProps {
  images: ImageDef[];
  interval?: number;
}

export default function ImageCarousel({ images, interval = 2000 }: ImageCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  // Auto scroll
  useEffect(() => {
    if (images.length <= 1 || isHovered || isTouched) return;

    const timer = setInterval(() => {
      if (scrollRef.current) {
        const width = scrollRef.current.clientWidth;
        if (width === 0) return;
        
        const currentScroll = scrollRef.current.scrollLeft;
        const currentIdx = Math.round(currentScroll / width);
        const nextIndex = (currentIdx + 1) % images.length;
        
        scrollRef.current.scrollTo({
          left: nextIndex * width,
          behavior: "smooth"
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, isHovered, isTouched]);

  // Handle manual scroll (swipe logic) - update pagination dots
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollContainer = scrollRef.current;
    
    // Find closest index based on scroll position
    const scrollPosition = scrollContainer.scrollLeft;
    const width = scrollContainer.clientWidth;
    if (width === 0) return;
    
    const closestIndex = Math.round(scrollPosition / width);
    
    if (closestIndex !== currentIndex) {
      setCurrentIndex(closestIndex);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="relative w-full h-full overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsTouched(true)}
      onTouchEnd={() => setIsTouched(false)}
    >
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="shrink-0 w-full h-full snap-center snap-always relative pointer-events-none overflow-hidden">
            <Image 
              src={img.src} 
              alt={`slide-${idx}`} 
              fill 
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={idx === 0}
              className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105" 
              style={img.style}
            />
          </div>
        ))}
      </div>

      {/* Pagination indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-20">
          {images.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
