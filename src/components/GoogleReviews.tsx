"use client";

import { useEffect, useState, useRef } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { maskName } from "@/lib/utils";

interface GoogleReview {
  id: string;
  author_name: string;
  rating: number;
  content: string;
  review_photos: string[];
  created_at: string;
}

export default function GoogleReviews() {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/google-reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setReviews(data.reviews);
      })
      .catch((err) => console.error("Failed to fetch google reviews", err))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector<HTMLElement>("[data-review-card]")?.offsetWidth ?? 380;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth - 24 : cardWidth + 24,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-none w-[320px] md:w-[380px] h-52 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-3xl font-black text-blue-600">G</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black text-slate-900">4.9</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>
            <p className="text-slate-600 font-medium">
              구글 맵 기준 <strong className="text-slate-900">5,000+</strong>개의 실제 고객 리뷰
            </p>
          </div>
        </div>

        <a
          href="https://www.google.com/maps/search/?api=1&query=Ocean+Star+Hawaii"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full md:w-auto bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-3 shrink-0"
        >
          구글에서 전체 리뷰 보기 <ChevronRight size={18} />
        </a>
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
        >
          <ChevronRight size={20} className="text-slate-600" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reviews.map((review) => (
            <div
              key={review.id}
              data-review-card
              className="flex-none w-[320px] md:w-[380px] bg-slate-50 rounded-2xl p-6 border border-slate-100 snap-start flex flex-col transform hover:-translate-y-1 transition duration-300"
            >
              {/* Profile + Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  {review.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{maskName(review.author_name)}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <p className="text-slate-700 italic whitespace-pre-wrap leading-relaxed text-sm font-medium flex-1 line-clamp-4">
                &ldquo;{review.content}&rdquo;
              </p>

              {/* Review Photos */}
              {review.review_photos && review.review_photos.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {review.review_photos.slice(0, 3).map((photo, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                      <Image
                        src={photo}
                        alt={`리뷰 사진 ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ))}
                  {review.review_photos.length > 3 && (
                    <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-xs text-slate-500 font-medium shrink-0">
                      +{review.review_photos.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
