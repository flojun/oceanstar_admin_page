"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, MapPin, Calendar, Users, CreditCard, Loader2, ChevronRight, Info, X, ShieldCheck, Star, Anchor, UsersRound, Award, MessageSquare, User, ClipboardList, AlertTriangle, Mail, Instagram, Youtube } from "lucide-react";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { calculateDistance, findClosestPickup, PickupLocation, getWalkingMinutes } from '@/lib/utils';
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse } from "date-fns";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import FAQSection from "@/components/FAQSection";
import PickupGuide from "@/components/PickupGuide";
import TourCourseTimeline from "@/components/TourCourseTimeline";
import { getPickupDisplayName } from '@/constants/pickupLocations';
import ImageCarousel from "@/components/ImageCarousel";

// Helper to format HH:mm:ss string to "hh:mm a"
const formatTimeAMPM = (timeString: string | null | undefined) => {
  if (!timeString) return '';
  try {
    const parsed = parse(timeString, 'HH:mm:ss', new Date());
    if (isNaN(parsed.getTime())) {
      const parsedShort = parse(timeString, 'HH:mm', new Date());
      return format(parsedShort, 'hh:mm a');
    }
    return format(parsed, 'hh:mm a');
  } catch (e) {
    return timeString;
  }
};

// Helper to mask middle characters of a name
const maskName = (name: string | null | undefined) => {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) return name.charAt(0) + '*';
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
};

const formSchema = z.object({
  tourDate: z.date(),
  adultCount: z.number().min(1, "최소 1명 이상 선택해주세요"),
  childCount: z.number().min(0),
  hotelName: z.string().min(1, "숙소를 입력해주세요"),
  bookerName: z.string().min(1, "예약자 성함을 입력해주세요"),
  bookerEmail: z.string().email("정확한 이메일을 입력해주세요"),
  bookerPhone: z.string().min(10, "연락처를 입력해주세요"),
});

const libraries: "places"[] = ["places"];

// Helper function to calculate Tiered Pricing for Private Tour
const calculateTieredPrivatePrice = (totalPax: number, exchangeRate: number): number => {
    let usdPrice = 0;
    if (totalPax <= 4) usdPrice = 1800;
    else if (totalPax <= 10) usdPrice = 2200;
    else if (totalPax <= 20) usdPrice = 2800;
    else if (totalPax <= 30) usdPrice = 3500;
    else usdPrice = 4500; // max 40

    // Do not round or use Math.round, use exact multiplied value
    return Math.floor(usdPrice * exchangeRate); 
};

export default function ReservationPage() {
  const [selectedTour, setSelectedTour] = useState<string | null>(null);
  const [expandedTourDetails, setExpandedTourDetails] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [closestPickup, setClosestPickup] = useState<{ location: PickupLocation, minutes: number } | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const infoSectionRef = useRef<HTMLElement>(null);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availabilities, setAvailabilities] = useState<Record<string, { booked: number, remaining: number, isAvailable: boolean }>>({});
  const [maxCapacity, setMaxCapacity] = useState(45);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [tourSettings, setTourSettings] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ date: string; tour_id: string; reason: string | null }[]>([]);

  // ==== 리뷰 상태 ====
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState<{ order_id: string; author_name: string; rating: number; content: string; images: File[] }>({ order_id: '', author_name: '', rating: 5, content: '', images: [] });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Image preview URL 생성 및 메모리 해제 (problem 10)
  useEffect(() => {
    const urls = reviewForm.images.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [reviewForm.images]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  const [isScrolled, setIsScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;
    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 20);
    };
    mainEl.addEventListener("scroll", handleScroll);
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/pickup')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPickupLocations(data);
      })
      .catch(err => console.error("Failed to fetch pickup locations", err));

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTourSettings(data.tourSettings);
          setBlockedDates(data.blockedDates);
        }
      })
      .catch(err => console.error("Failed to fetch tour settings", err));

    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.success) {
         setReviews(data.reviews);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const onReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('order_id', reviewForm.order_id);
      formData.append('author_name', reviewForm.author_name);
      formData.append('rating', String(reviewForm.rating));
      formData.append('content', reviewForm.content);

      if (reviewForm.images.length > 5) {
        alert("사진은 최대 5장까지만 업로드 가능합니다.");
        setIsSubmittingReview(false);
        return;
      }

      for (const file of reviewForm.images) {
        try {
            const options = {
                maxSizeMB: 1, 
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: file.type
            };
            const compressedFile = await imageCompression(file, options);
            formData.append('images', compressedFile);
        } catch (error) {
            console.error("Image compression error:", error);
            formData.append('images', file);
        }
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert("리뷰가 성공적으로 등록되었습니다. 감사합니다!");
        setReviewForm({ order_id: '', author_name: '', rating: 5, content: '', images: [] });
        setIsReviewOpen(false);
        fetchReviews();
      } else {
        alert(data.error || "리뷰 등록 중 오류가 발생했습니다.");
      }
    } catch (e) {
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adultCount: 1,
      childCount: 0,
      hotelName: "",
      bookerName: "",
      bookerEmail: "",
      bookerPhone: "",
    },
  });

  const adultCount = form.watch("adultCount");
  const childCount = form.watch("childCount");
  const totalSelectedPax = (adultCount || 0) + (childCount || 0);

  const fetchAvailability = useCallback(async (tourId: string, targetDate: Date) => {
    setIsLoadingAvailability(true);
    try {
      let optionLabel = tourId;
      const currentTour = tourSettings?.find((t: any) => t.tour_id === tourId);
      if (currentTour) optionLabel = currentTour.name;

      const monthStr = format(targetDate, 'yyyy-MM');
      const res = await fetch(`/api/availability?month=${monthStr}&option=${encodeURIComponent(optionLabel)}`);
      const data = await res.json();

      if (data.success) {
        setAvailabilities(data.availability);
        setMaxCapacity(data.maxCapacity);
      }
    } catch (e) {
      console.error("Failed to fetch availability", e);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [tourSettings]);

  useEffect(() => {
    if (selectedTour) {
      fetchAvailability(selectedTour, currentMonth);
      setSelectedDate(undefined);
      form.setValue("tourDate", undefined as unknown as Date);
    }
  }, [selectedTour, currentMonth, fetchAvailability, form]);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (lat && lng) {
        form.setValue("hotelName", place.name || "");
        const result = findClosestPickup(lat, lng, pickupLocations);
        if (result) {
          setClosestPickup({
            location: result.closestLocation,
            minutes: getWalkingMinutes(result.distanceMeters)
          });
        }
      }
    }
  };

  const getSelectedTourSetting = () => tourSettings.find((s: any) => s.tour_id === selectedTour);
  const selectedTourSetting = getSelectedTourSetting();
  const isFlatRate = selectedTourSetting?.is_flat_rate || false;

  const getPriceForTour = (tourId: string, type: 'adult' | 'child' = 'adult') => {
    const setting = tourSettings.find((s: any) => s.tour_id === tourId);
    if (!setting) return 0;
    return type === 'adult' ? setting.adult_price_krw : setting.child_price_krw;
  };

  const currentAdultPrice = selectedTour ? getPriceForTour(selectedTour, 'adult') : (tourSettings[0]?.adult_price_krw || 135000);
  const currentChildPrice = selectedTour ? getPriceForTour(selectedTour, 'child') : (tourSettings[0]?.child_price_krw || 108000);

  // Calculate Total Price dynamically
  let totalPrice = 0;
  if (isFlatRate && selectedTour === 'private') {
     const exchangeRate = selectedTourSetting?.adult_price_usd ? (selectedTourSetting.adult_price_krw / selectedTourSetting.adult_price_usd) : 1350;
     totalPrice = calculateTieredPrivatePrice(totalSelectedPax, exchangeRate);
  } else if (isFlatRate) {
     totalPrice = currentAdultPrice;
  } else {
     totalPrice = (adultCount * currentAdultPrice) + (childCount * currentChildPrice);
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedTour) {
      alert("투어 옵션을 먼저 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = format(values.tourDate, "yyyy-MM-dd");

      const response = await fetch('/api/eximbay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedTour,
          pickupLocationId: closestPickup?.location?.id,
          pickupLocationName: closestPickup?.location?.name || '',
          totalPrice,
          ...values,
          tourDate: formattedDate,
        })
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert("결제 준비 중 오류가 발생했습니다: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-blue-200 selection:text-blue-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            "name": "하와이 오션스타 거북이 스노클링 투어",
            "description": "하와이 최초! 한국인 대상 거북이 스노클링 원조 오션스타",
            "provider": {
              "@type": "Organization",
              "name": "Ocean Star Hawaii"
            },
            "offers": {
              "@type": "Offer",
              "price": tourSettings.find((t: any) => t.is_active !== false)?.adult_price_krw?.toString() || "150000",
              "priceCurrency": "KRW"
            }
          })
        }}
      />
      <header className={`w-full z-40 transition-all duration-300 bg-white/80 backdrop-blur-md shrink-0 ${isScrolled ? 'shadow-sm border-b border-slate-200' : 'border-b border-transparent'}`}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col items-center">
            <span className="text-[11.5px] font-bold text-blue-500/90 tracking-widest leading-none mb-1">하와이 거북이 스노클링</span>
            <h1 className="text-2xl font-black text-blue-600 tracking-tighter uppercase drop-shadow-sm leading-none">OceanStar</h1>
          </div>
          <div className="flex items-center gap-3">
             <Link 
                href="/manage-booking"
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-all">
                내 예약 관리
             </Link>
             <button 
                onClick={() => setIsBookingOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm shadow-md transition-all sm:block hidden">
                투어 예약하기
             </button>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="w-full flex-1 overflow-y-auto pb-0">
        {/* === 1. Hero Section === */}
        <section className="relative w-full h-[100svh] sm:h-[85vh] min-h-[500px] sm:min-h-[600px] overflow-hidden">
          {/* Background Overlay - Top and Bottom gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-transparent to-blue-900/70 z-10"></div>
          
          {/* Background Image */}
          <div className="absolute inset-0 bg-blue-500">
             <Image src="/turtle-hero.jpg" alt="하와이 거북이 스노클링 오션스타" fill className="object-cover object-center sm:object-bottom" priority />
          </div>
          
          {/* Top Text Content */}
          <div className="absolute top-0 left-0 right-0 z-20 text-center px-4 pt-16 sm:pt-20 lg:pt-[5vh] xl:pt-[4vh] 2xl:pt-[3vh] max-w-5xl mx-auto flex flex-col items-center">
             <span className="inline-block py-1 px-3 sm:py-1.5 sm:px-4 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs sm:text-sm md:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4 animate-fade-in-up">
               Original Hawaii Tour
             </span>
             <h1 className="text-[2.8rem] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight sm:leading-tight drop-shadow-2xl animate-fade-in-up animation-delay-100 break-keep">
                하와이 최초!<br/>거북이 스노클링 투어,<br className="sm:hidden" /><span className="hidden sm:inline"> </span>오션스타★
             </h1>
          </div>

          {/* Bottom Text Content & Button */}
          <div className="absolute bottom-0 left-0 right-0 z-20 text-center px-4 pb-24 sm:pb-28 lg:pb-32 max-w-4xl mx-auto flex flex-col items-center">
             <p className="text-sm sm:text-base md:text-xl text-white font-medium mb-4 sm:mb-8 drop-shadow-lg leading-relaxed animate-fade-in-up animation-delay-200 max-w-[90%] sm:max-w-none">
                연 2만명 이상의 고객들과 13,000개의 후기가 입증하는 하와이 단연 1위 거북이 스노클링 투어입니다!<br />
                와이키키에서 가장 재미있고 특별한 경험을 오션스타와 함께 하세요!
             </p>
             <button 
                onClick={() => setIsBookingOpen(true)}
                className="bg-white text-blue-800 hover:bg-blue-50 hover:scale-105 transition-all px-5 py-2.5 sm:px-8 sm:py-4 rounded-full font-extrabold text-sm sm:text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] animate-fade-in-up animation-delay-300">
                지금 예약하고 최저가 보장받기
             </button>
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-20 relative z-30">
        
          {/* === 2. Bento Box Introduction === */}
          <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-12 sm:mb-20">
            <div className="bg-white rounded-3xl p-6 lg:p-7 shadow-xl border border-slate-100 flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <Award className="w-10 h-10 text-amber-500 mb-4 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-2 break-keep">Since 2019,</h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed break-keep">한국인에게 가장 사랑받는 하와이 와이키키 거북이 스노클링 투어</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 lg:p-7 shadow-xl text-white flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <Star className="w-10 h-10 text-yellow-300 mb-4 fill-yellow-300 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-white mb-2 break-keep">13,000+ 누적 리뷰 ★업계 최다★</h3>
              <p className="text-blue-100 font-medium text-sm leading-relaxed break-keep">압도적인 신뢰와 만족도</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 lg:p-7 shadow-xl border border-slate-100 flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-2 break-keep">거북이 100% 만남 보장</h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed break-keep">오션스타와 함께라면 와이키키 자연산 바다 거북이를 반드시 만나실 수 있습니다.</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 lg:p-7 shadow-xl border border-slate-100 flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <Anchor className="w-10 h-10 text-blue-500 mb-4 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-2 break-keep">51인승 루프탑 보트</h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed break-keep">와이키키 유일! 자외선·비 100% 차단, 흔들림을 최소화하여 멀미 없는 쾌적함.</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 lg:p-7 shadow-xl border border-slate-100 flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <UsersRound className="w-10 h-10 text-purple-500 mb-4 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-2 break-keep">해양 전문 한국인 크루</h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed break-keep">수영을 전혀 못해도, 영어를 전혀 못해도 괜찮습니다! 한국인 크루 상주!</p>
            </div>
          </section>

          {/* === 3. Tour Packages (Cards) === */}
          <section className="mb-10">
            <div className="text-center mb-12">
               <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">오션스타 추천 프로그램</h2>
               <p className="text-lg text-slate-500">당신의 완벽한 하와이 여행을 위한 최고의 선택</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {(() => {
                  const activeTours = tourSettings.filter((t: any) => t.is_active !== false).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
                  const m1 = activeTours.find((t: any) => t.tour_id === 'morning1');
                  const m2 = activeTours.find((t: any) => t.tour_id === 'morning2');
                  const others = activeTours.filter((t: any) => t.tour_id !== 'morning1' && t.tour_id !== 'morning2');
                  
                  let displayCards = activeTours;
                  if (m1 && m2) {
                     const combined = {
                        ...m1,
                        tour_id: 'combined_morning', // virtual id to avoid preselecting 1부 or 2부 in modal
                        name: '와이키키 거북이 스노클링',
                        is_combined: true,
                     };
                     displayCards = [combined, ...others].sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
                  }

                  displayCards = displayCards.map((t: any) => {
                    if (t.tour_id?.toLowerCase().includes('sunset')) return { ...t, name: '선셋·와인 & 와이키키 거북이 스노클링' };
                    if (t.tour_id === 'private') return { ...t, name: <span className="block text-center leading-snug">[단독] 프라이빗<br/>와이키키 거북이 스노클링</span> };
                    return t;
                  });

                  return displayCards.map((tour: any, idx: number) => {
                    const isPrivate = tour.is_flat_rate && tour.tour_id === 'private';
                    const isSunset = tour.tour_id?.toLowerCase().includes('sunset');
                    
                    const themes: { bg: string, gradient: string, text: string, badge: string, btn: string, specialLabel?: string, isDark?: boolean }[] = [
                      { bg: 'bg-cyan-100', gradient: 'from-cyan-500 to-blue-400', text: 'text-blue-900', badge: '🌊 가장 인기있는 상품', btn: 'bg-slate-900 hover:bg-slate-800', isDark: false },
                      { bg: 'bg-orange-100', gradient: 'from-orange-400 to-rose-400', text: 'text-orange-900', badge: '⏰ 여유로운 출발시간', btn: 'bg-orange-500 hover:bg-orange-600', isDark: false },
                      { bg: 'bg-indigo-100', gradient: 'from-indigo-500 to-purple-500', text: 'text-indigo-900', badge: '✨ 프리미엄 투어', btn: 'bg-indigo-600 hover:bg-indigo-700', isDark: false }
                    ];
                    
                    let theme = themes[idx % themes.length];
                    if (isPrivate) theme = { bg: 'bg-slate-800', gradient: 'from-slate-800 to-indigo-900', text: 'text-white', badge: '🛥️ VVIP 단독 보트 대관', btn: 'bg-indigo-500 hover:bg-indigo-400', isDark: true };
                    else if (isSunset) theme = { bg: 'bg-orange-100', gradient: 'from-orange-400 to-rose-400', text: 'text-orange-900', badge: '🌅 로맨틱 선셋 뷰', btn: 'bg-orange-500 hover:bg-orange-600', specialLabel: '커플/신혼 여행객 추천!', isDark: false };

                      const tourImages = (() => {
                        if (isSunset) {
                          return [
                            { src: '/images_option_card/sunset.jpg' },
                            { src: '/images_option_card/snorkeling_turtle2.jpg', style: { objectPosition: 'center 20%', transform: 'rotate(-0.68deg) scale(1.03)' } },
                            { src: '/images_option_card/kayak_sunset.jpg', style: { transform: 'rotate(1.64deg) scale(1.05)' } },
                            { src: '/images_option_card/sunset_people.jpg', style: { objectPosition: 'right center', transform: 'rotate(0.91deg) scale(1.03)' } }
                          ];
                        } else {
                          return [
                            { src: '/images_option_card/snorkeling_turtle.jpg', style: { transform: 'rotate(-6deg) scale(1.15)' } },
                            { src: '/images_option_card/paddleboad_people.jpg', style: { objectPosition: 'center 80%', transform: 'rotate(-1.12deg) scale(1.04)' } },
                            { src: '/images_option_card/snorkeling_turtle2.jpg', style: { objectPosition: 'center 20%', transform: 'rotate(-0.68deg) scale(1.03)' } },
                          ];
                        }
                      })();

                    return (
                      <div key={tour.tour_id} className={`${theme.isDark ? 'bg-slate-900 text-white' : 'bg-white'} flex-col rounded-3xl shadow-lg border ${theme.isDark ? 'border-slate-800' : 'border-slate-100'} overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2 flex group relative`}>
                        {theme.specialLabel && (
                          <div className="absolute top-0 right-10 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-b-xl z-10 shadow-md">
                            {theme.specialLabel}
                          </div>
                        )}
                        <div className={`h-48 ${theme.bg} relative overflow-hidden shrink-0`}>
                          <ImageCarousel images={tourImages} interval={2000} />
                          <div className={`absolute bottom-4 left-4 ${theme.isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white/90 text-' + theme.text} backdrop-blur text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 w-max z-10`}>
                            {theme.badge}
                          </div>
                        </div>
                        <div className={`p-6 sm:p-8 flex-1 flex flex-col`}>
                          <h3 className={`text-2xl font-bold text-center ${theme.isDark ? 'text-white' : 'text-slate-800'} mb-3`}>{tour.name}</h3>
                          <p className={`${theme.isDark ? 'text-slate-300' : 'text-slate-600'} mb-6 text-sm leading-relaxed flex-1`}>
                            {tour.description || "와이키키 최고의 투어를 오션스타와 함께하세요. 전문가의 안내로 안전하고 즐거운 시간을 보장합니다."}
                          </p>
                          <div className={`${theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} p-4 rounded-2xl mb-6 border`}>
                            <ul className={`space-y-2 text-sm ${theme.isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                                <li className="flex items-start gap-2">
                                  <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                  {tour.is_flat_rate ? `우리 일행 단독 탑승 (최대 ${tour.max_capacity}인)` : '거북이 스노클링 + 해양 5종'}
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                  {tour.is_flat_rate ? '원하는 옵션 커스터마이징 가능' : '스노클 장비/구명조끼, 음료/간식'}
                                </li>
                                {isSunset && (
                                  <li className="flex items-start gap-2">
                                    <Check className="text-emerald-500 w-4 h-4 mt-0.5 shrink-0" />
                                    <span>치즈보드와 와인 제공</span>
                                  </li>
                                )}
                                {tour.is_combined ? (
                                  <>
                                    <li className="flex items-start gap-2">
                                      <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                      <span>1부 08:00 - 11:00</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                      <span>2부 11:00 - 14:00</span>
                                    </li>
                                  </>
                                ) : (
                                  <li className="flex items-start gap-2">
                                    <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                    <div className="flex flex-col gap-1">
                                      {tour.is_flat_rate ? (
                                        <span>인원수 연동 맞춤형 요금 적용</span>
                                      ) : (
                                        <span>{isSunset ? '시즌별 시간 변동' : `${tour.start_time?.slice(0,5) || '07:30'} - ${tour.end_time?.slice(0,5) || '14:30'}`}</span>
                                      )}
                                    </div>
                                  </li>
                                )}
                            </ul>
                          </div>
                          <div className={`flex flex-wrap items-end justify-between border-t ${theme.isDark ? 'border-slate-700' : 'border-slate-100'} pt-6 gap-2`}>
                            <div className="flex-1 min-w-[60%]">
                              <p className="text-xs text-slate-400 font-medium">
                                {tour.is_flat_rate ? (tour.tour_id === 'private' ? '1~4인 기준 (인원별 상이)' : `최대 ${tour.max_capacity}인 기준`) : '성인가 기준 (24개월 미만 무료)'}
                              </p>
                              <p className={`text-xl sm:text-2xl font-black truncate pr-2 ${theme.isDark ? 'text-indigo-400' : (isSunset ? 'text-orange-600' : 'text-blue-600')}`}>
                                {tour.is_flat_rate && tour.tour_id === 'private' ? (
                                  <>₩{Math.floor(calculateTieredPrivatePrice(1, (tour.adult_price_krw / (tour.adult_price_usd || 1)))).toLocaleString()} ~</>
                                ) : (
                                  <>₩{Math.floor(tour.adult_price_krw || 0).toLocaleString()}{tour.is_flat_rate ? ' / 팀' : ''}</>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-auto shrink-0 w-full sm:w-auto">
                                <button 
                                  onClick={() => setExpandedTourDetails(tour)} 
                                  className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap border-2 ${theme.isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} flex justify-center items-center gap-1 active:scale-95`}
                                >
                                  자세히 보기
                                </button>
                                <button onClick={() => { if(tour.tour_id !== 'combined_morning' && tour.tour_id) { setSelectedTour(tour.tour_id); } else { setSelectedTour(null); } if(tour.is_flat_rate) form.setValue("childCount", 0); setIsBookingOpen(true); }} className={`flex-1 sm:flex-none ${theme.btn} text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-transform active:scale-95 whitespace-nowrap shadow-[0_4px_14px_0_rgba(0,118,255,0.39)]`}>예약하기</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
               })()}
            </div>
          </section>
        </div>

        {/* === 4. Customer Reviews Section === */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-20 relative z-30">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                   <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">생생한 리얼 후기</h2>
                   <p className="text-lg text-slate-500">당일 취소, 노쇼 없이 검증된 고객님들의 찐 후기입니다.</p>
                </div>
                <button 
                   onClick={() => setIsReviewOpen(true)}
                   className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                   <MessageSquare size={18} />
                   리뷰 작성하기
                </button>
            </div>

            {isLoadingReviews ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center text-slate-500 font-medium">
                    첫 번째 리뷰의 주인공이 되어주세요!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col h-full transform hover:-translate-y-1 transition duration-300">
                            <div className="flex items-center gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} />
                                ))}
                            </div>
                            <p className="text-slate-700 italic whitespace-pre-wrap leading-relaxed text-sm mb-4 font-medium flex-1">
                                "{review.content}"
                            </p>
                            {review.image_urls && review.image_urls.length > 0 && (
                                <div className={`grid gap-2 mb-4 ${review.image_urls.length === 1 ? 'grid-cols-1' : review.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                    {review.image_urls.slice(0, 5).map((url: string, index: number) => (
                                        <div key={index} className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 shadow-sm">
                                            <Image 
                                              src={url} 
                                              alt={`스노클링 리뷰 이미지 ${index + 1}`} 
                                              fill 
                                              className="object-cover cursor-pointer hover:scale-105 transition-transform" 
                                              sizes="(max-width: 768px) 33vw, 20vw" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="border-t border-slate-100 pt-4 flex items-center gap-3 mt-auto">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{maskName(review.author_name)}</p>
                                    <p className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Google Reviews Banner */}
            <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                        {/* Using a simple G text as placeholder for Google logo if SVG is unavailable */}
                        <span className="text-3xl font-black text-blue-600">G</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-black text-slate-900">4.9</span>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                        </div>
                        <p className="text-slate-600 font-medium">구글 맵 기준 <strong className="text-slate-900">5,000+</strong>개의 실제 고객 리뷰</p>
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
        </section>

        {/* === Pickup Guide Section === */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-20 relative z-30">
            <PickupGuide />
        </div>

        {/* === FAQ Section === */}
        <FAQSection />

        {/* === 6. Business Hours and Company Info (Footer) === */}
        <section className="bg-slate-900 text-slate-300 py-16 mt-20 relative z-30 pb-32">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Mail size={20} className="text-blue-400" /> 하와이 현지 영업시간 안내</h3>
                    <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 max-w-sm flex flex-col gap-4">
                        <div className="text-slate-300 font-medium flex items-center gap-3">
                            <span className="bg-slate-700 px-2 py-1.5 rounded text-xs shrink-0">영업시간</span>
                            <span className="text-sm">하와이 현지 기준 월~토 09:00~17:00</span>
                        </div>
                        <div className="flex items-center gap-6 pt-5 mt-2">
                            <a 
                                href="https://www.instagram.com/hawaii_turtlesnorkelling/" 
                                target="_blank" 
                                rel="noreferrer"
                                className="transform transition-all duration-300 hover:-translate-y-2 hover:scale-110 drop-shadow-sm hover:drop-shadow-xl"
                                title="Instagram"
                            >
                                <Instagram size={47} className="text-pink-500" />
                            </a>
                            <a 
                                href="https://www.youtube.com/@oceanstarhi" 
                                target="_blank" 
                                rel="noreferrer"
                                className="transform transition-all duration-300 hover:-translate-y-2 hover:scale-105 drop-shadow-sm hover:drop-shadow-xl"
                                title="YouTube"
                            >
                                <Youtube size={52} className="text-red-600" />
                            </a>
                        </div>
                    </div>
                 </div>
                 
                 <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><MapPin size={20} className="text-blue-400" /> 하와이 주소 및 연락처</h3>
                    <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 max-w-sm flex flex-col gap-3">
                        <div className="text-slate-300 font-medium flex items-center gap-3">
                            <span className="bg-slate-700 px-2 py-1.5 rounded text-xs shrink-0">이메일</span>
                            <span className="text-sm">hioceanstar@gmail.com</span>
                        </div>
                        <div className="text-slate-300 font-medium flex items-start gap-3">
                            <span className="bg-slate-700 px-2 py-1.5 rounded text-xs shrink-0 mt-0.5">주소</span>
                            <div className="flex flex-col gap-1.5 pt-0.5">
                                <span className="text-sm leading-relaxed">1125 Kewalo Basin Harbor, Gate D #110, Honolulu, HI 96814</span>
                                <a 
                                    href="https://www.google.com/maps/place/%EC%98%A4%EC%85%98%EC%8A%A4%ED%83%80/@21.2909527,-157.8596751,17.95z/data=!4m6!3m5!1s0x7c006e0714500001:0x42c44e799ee07eac!8m2!3d21.2913542!4d-157.8586971!16s%2Fg%2F11t2p_627w?authuser=0&entry=ttu&g_ep=EgoyMDI2MDMyMy4xIKXMDSoASAFQAw%3D%3D" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 w-fit transition-colors mt-0.5"
                                >
                                    구글 지도로 바로보기 <ChevronRight size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>

             <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
                 <div>
                     <h4 className="text-white font-bold mb-2">오션스타 (Waikiki Turtle Snorkeling)</h4>
                     <p className="text-slate-500 text-sm">하와이 한인 최초 거북이 스노클링 원조<br/>여행 플랫폼 8,000 리뷰 · 구글 5,000 리뷰</p>
                 </div>
                 <div className="text-slate-500 text-sm md:text-right space-y-1">
                     <p><span className="text-slate-400 font-medium">상호명:</span> 알로하 하와이 <span className="mx-2 hidden md:inline">|</span><br className="md:hidden" /> <span className="text-slate-400 font-medium">대표자명:</span> 정칠성</p>
                     <p><span className="text-slate-400 font-medium">사업자등록번호:</span> 765-23-01629</p>
                     <p><span className="text-slate-400 font-medium">사업장 소재지:</span> 경기도 안양시 만안구 양화로135번길 29, 3층 일부호(박달동)</p>
                 </div>
             </div>
          </div>
        </section>

      </main>

      {/* 플로팅 예약 버튼 - main 바깥에 위치하여 iOS 스크롤 점프 방지 */}
      {!isBookingOpen && !isReviewOpen && (
        <div className="w-full shrink-0 p-3 sm:p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex justify-center">
          <div className="max-w-[1600px] w-full flex justify-between items-center gap-3 px-2 sm:px-4">
            <div className="min-w-0 shrink-0">
              <p className="text-xs sm:text-sm text-slate-500 font-medium">하와이 단연 1위</p>
              <p className="text-base sm:text-xl font-extrabold text-blue-600 whitespace-nowrap">최고의 스노클링 투어 예약</p>
            </div>
            <button
              onClick={() => setIsBookingOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 sm:py-3 sm:px-8 rounded-full shadow-lg shadow-blue-500/30 transition-transform active:scale-95 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0"
            >
              예약하기 <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* === 예약 플로팅 모달 (Booking Drawer/Modal) === */}
      {isBookingOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsBookingOpen(false)}></div>
            <div className="relative w-full max-w-[550px] h-full bg-slate-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">투어 예약</h2>
                <button onClick={() => setIsBookingOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 pb-48">
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                  <div className="space-y-6">
                    {/* 1. Tour Selection */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black">1</span>
                        투어 선택
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tourSettings.filter((t: any) => t.is_active !== false).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)).map((tour: any) => (
                          <div
                            key={tour.tour_id}
                            onClick={() => {
                              setSelectedTour(tour.tour_id);
                              if (tour.is_flat_rate) {
                                form.setValue("childCount", 0);
                              }
                            }}
                            className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedTour === tour.tour_id
                              ? "border-blue-600 bg-blue-50/50 shadow-md scale-[1.02] transform"
                              : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50"
                              }`}
                          >
                            {selectedTour === tour.tour_id && (
                              <div className="absolute top-3 right-3 text-blue-600 bg-white rounded-full p-0.5 shadow-sm">
                                <Check size={16} strokeWidth={3} />
                              </div>
                            )}
                            <h3 className="font-bold text-base mb-1 text-slate-800">{tour.name}</h3>
                            <p className="text-xs text-slate-500 mb-3">
                              {tour.is_flat_rate ? `최대 ${tour.max_capacity}인 단독 대관` : (tour.tour_id?.toLowerCase().includes('sunset') ? '시즌별 시간 변동' : `${tour.start_time || '오전'} - ${tour.end_time || '(종료 미정)'}`)}
                            </p>
                            <p className="font-extrabold text-blue-700 text-sm">
                              {tour.is_flat_rate && tour.tour_id === 'private' ? '단독 차터 (계단식 요금)' : tour.is_flat_rate ? `₩${tour.adult_price_krw?.toLocaleString()} / 팀` : `₩${tour.adult_price_krw?.toLocaleString()} / 성인`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 2. Pax Selection */}
                    {selectedTour && (
                      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black">2</span>
                          인원 입력
                        </h2>
                        {isFlatRate && selectedTour === 'private' && (
                            <div className="mb-4 bg-indigo-50 text-indigo-900 p-4 rounded-xl text-sm border border-indigo-100 shadow-sm">
                                <strong className="flex items-center gap-2 mb-1"><Info size={16} className="text-indigo-600" /> 프라이빗 차터 요금 안내</strong>
                                <p className="text-xs mb-2 opacity-80">(총 인원, 단일 예약 기준)</p>
                                <ul className="space-y-1 ml-6 list-disc opacity-90 font-medium">
                                    <li>1~4명: $1,800</li>
                                    <li>5~10명: $2,200</li>
                                    <li>11~20명: $2,800</li>
                                    <li>21~30명: $3,500</li>
                                    <li>31~40명: $4,500</li>
                                </ul>
                            </div>
                        )}
                        <div className={`grid ${(isFlatRate) ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                          <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                              {isFlatRate ? <><Users size={16} className="text-blue-500" /> 총 탑승 인원</> : <><Users size={16} className="text-blue-500" /> 성인</>}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={isFlatRate ? selectedTourSetting?.max_capacity : undefined}
                              {...form.register("adultCount", { valueAsNumber: true })}
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-lg bg-slate-50 focus:bg-white"
                            />
                            {isFlatRate && (
                              <p className="text-xs text-slate-500 mt-2">※ 탑승 정원은 최대 {selectedTourSetting?.max_capacity || 40}명입니다.</p>
                            )}
                          </div>
                          {!(isFlatRate) && (
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">
                                아동 (만3-11세)
                              </label>
                              <input
                                type="number"
                                min="0"
                                {...form.register("childCount", { valueAsNumber: true })}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-lg bg-slate-50 focus:bg-white"
                              />
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* 3. Date Selection */}
                    {selectedTour && (
                      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black">3</span>
                            날짜 선택
                          </h2>
                          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            예약가능 정원: {maxCapacity}명
                          </div>
                        </div>

                        <div className="flex justify-center border-2 border-slate-100 rounded-2xl p-4 bg-slate-50/50 relative shadow-inner">
                          {isLoadingAvailability && (
                            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                              <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
                            </div>
                          )}
                          <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onMonthChange={setCurrentMonth}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              if (date) {
                                form.setValue("tourDate", date, { shouldValidate: true });
                                setTimeout(() => {
                                  infoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 150);
                              }
                            }}
                            disabled={(date) => {
                              if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;

                              const currentSetting = tourSettings.find(s => s.tour_id === selectedTour);
                              const blockedDays = currentSetting?.blocked_days || [];
                              if (blockedDays.includes(date.getDay())) return true;

                              const dateStr = format(date, 'yyyy-MM-dd');

                              const isBlocked = blockedDates.some(bd =>
                                bd.date === dateStr && (bd.tour_id === 'all' || bd.tour_id === selectedTour)
                              );
                              if (isBlocked) return true;

                              const dayData = availabilities[dateStr];

                              if (dayData && dayData.isAvailable === false) return true;
                              if (isFlatRate && selectedTour === 'private') return false; 

                              const remaining = dayData ? dayData.remaining : maxCapacity;
                              return remaining < totalSelectedPax;
                            }}
                            className="bg-white p-2 sm:p-4 rounded-xl shadow-sm"
                            classNames={{
                              today: "font-black text-blue-600 bg-blue-50 rounded-lg",
                              selected: "bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md",
                            }}
                            modifiers={{
                              booked: (date) => {
                                const currentSetting = tourSettings.find(s => s.tour_id === selectedTour);
                                const blockedDays = currentSetting?.blocked_days || [];
                                if (blockedDays.includes(date.getDay())) return true;

                                const dateStr = format(date, 'yyyy-MM-dd');
                                const isBlocked = blockedDates.some(bd =>
                                  bd.date === dateStr && (bd.tour_id === 'all' || bd.tour_id === selectedTour)
                                );
                                if (isBlocked) return true;

                                const dayData = availabilities[dateStr];
                                if (dayData && dayData.isAvailable === false) return true;
                                if (isFlatRate && selectedTour === 'private') return false;

                                const remaining = dayData ? dayData.remaining : maxCapacity;
                                return remaining < totalSelectedPax;
                              }
                            }}
                            modifiersStyles={{
                              booked: { textDecoration: 'line-through', color: '#ef4444', opacity: 0.7 }
                            }}
                          />
                        </div>
                        {form.formState.errors.tourDate && <p className="text-red-500 text-xs mt-3 text-center font-bold bg-red-50 p-2 rounded-lg">{form.formState.errors.tourDate.message}</p>}

                        <p className="text-center text-xs text-slate-500 mt-4 font-medium">
                          선택하신 <strong className="text-blue-600">{totalSelectedPax}명</strong> 인원에 맞춰 예약 가능한 날짜만 활성화됩니다.
                        </p>
                      </section>
                    )}



                    {/* 4. Hotel Pick-up & Info */}
                    {selectedTour && selectedDate && (
                      <section ref={infoSectionRef} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black">4</span>
                          예약 정보 입력
                        </h2>

                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <MapPin size={16} className="text-blue-500" /> 숙소 입력 (구글 지도 연동)
                                    </label>
                                    {isLoaded ? (
                                    <Autocomplete
                                        onLoad={onLoad}
                                        onPlaceChanged={onPlaceChanged}
                                    >
                                        <input
                                        type="text"
                                        {...form.register("hotelName")}
                                        placeholder="머무시는 숙소/호텔 이름 입력 (영문)"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                                        />
                                    </Autocomplete>
                                    ) : (
                                    <input
                                        type="text"
                                        {...form.register("hotelName")}
                                        placeholder="머무시는 숙소를 입력해주세요"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                                    />
                                    )}
                                    {form.formState.errors.hotelName && <p className="text-red-500 text-xs mt-1 font-bold">{form.formState.errors.hotelName.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">픽업 장소 선택</label>
                                    <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer font-medium"
                                    value={closestPickup?.location?.id || ""}
                                    onChange={(e) => {
                                        const selectedLoc = pickupLocations.find(loc => loc.id === e.target.value);
                                        if (selectedLoc) {
                                        setClosestPickup({
                                            location: selectedLoc,
                                            minutes: 0
                                        });
                                        }
                                    }}
                                    >
                                    <option value="" disabled>가까운 장소가 추천되거나 직접 골라주세요</option>
                                    {pickupLocations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                        {getPickupDisplayName(loc.name)}
                                        {(!isFlatRate || selectedTour !== 'private') && selectedTour === 'morning1' && loc.time_1 ? ` (${formatTimeAMPM(loc.time_1)})` : ''}
                                        {(!isFlatRate || selectedTour !== 'private') && selectedTour === 'morning2' && loc.time_2 ? ` (${formatTimeAMPM(loc.time_2)})` : ''}
                                        {(!isFlatRate || selectedTour !== 'private') && selectedTour === 'sunset' && loc.time_3 ? ` (${formatTimeAMPM(loc.time_3)})` : ''}
                                        </option>
                                    ))}
                                    </select>
                                    {isFlatRate && selectedTour === 'private' && (
                                    <p className="text-sm text-indigo-700 mt-2 font-bold bg-indigo-100/50 p-2.5 rounded-lg flex items-center gap-2">
                                        <Info size={16} /> 프라이빗 차터 픽업 시간은 예약 후 개별 조율됩니다.
                                    </p>
                                    )}
                                </div>
                            </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">예약자 성함 (여권 영문명)</label>
                              <input
                                type="text"
                                placeholder="예: HONG GILDONG"
                                {...form.register("bookerName")}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                              />
                              {form.formState.errors.bookerName && <p className="text-red-500 text-xs mt-1 font-bold">{form.formState.errors.bookerName.message}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">이메일 (바우처 수신용)</label>
                              <input
                                type="email"
                                placeholder="example@email.com"
                                {...form.register("bookerEmail")}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                              />
                              {form.formState.errors.bookerEmail && <p className="text-red-500 text-xs mt-1 font-bold">{form.formState.errors.bookerEmail.message}</p>}
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-slate-700 mb-2">연락처 (카카오톡 ID 또는 연락처)</label>
                              <input
                                type="text"
                                placeholder="+82 10-1234-5678"
                                {...form.register("bookerPhone")}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                              />
                              {form.formState.errors.bookerPhone && <p className="text-red-500 text-xs mt-1 font-bold">{form.formState.errors.bookerPhone.message}</p>}
                            </div>
                          </div>
                        </div>
                      </section>
                    )}
                  </div>

                  {/* Submit Float Info */}
                  {selectedTour && selectedDate && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom duration-300">
                        <div className="max-w-[500px] mx-auto">
                            <div className="flex justify-between items-end mb-4">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 font-bold text-sm">총 결제 금액 <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded ml-1 text-slate-600">KRW</span></span>
                                    <span className="text-xs text-slate-400 mt-1 font-medium bg-slate-100 px-2 py-1 rounded w-fit">{(isFlatRate && selectedTour === 'private') ? `프라이빗 차터 (총 ${totalSelectedPax}명)` : `성인 ${adultCount}명 / 아동 ${childCount}명`}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-blue-600 tracking-tight">₩{totalPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-black text-lg py-4 rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 shadow-xl shadow-blue-600/30"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <CreditCard size={24} />}
                                {isSubmitting ? "응답 대기 중..." : "엑심베이 결제하기"}
                            </button>
                        </div>
                    </div>
                  )}
                  
                  {/* Space for the floated button overlay above */}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* === 리뷰 작성 모달 (Review Write Modal) === */}
        {isReviewOpen && (
          <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsReviewOpen(false)}></div>
            <div className="relative w-full max-w-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="text-blue-500" /> 솔직한 후기를 남겨주세요
                </h2>
                <button onClick={() => setIsReviewOpen(false)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={onReviewSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">예약 번호 (영숫자 6자리)</label>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="예: A4X9T2"
                            value={reviewForm.order_id}
                            onChange={(e) => setReviewForm({ ...reviewForm, order_id: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase tracking-widest font-mono font-bold"
                        />
                        <p className="text-xs text-slate-500 mt-1">예약 확정 및 결제 후 전송된 바우처에서 확인하실 수 있습니다.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">작성자 성함 (또는 닉네임)</label>
                        <input
                            type="text"
                            required
                            placeholder="홍길동"
                            value={reviewForm.author_name}
                            onChange={(e) => setReviewForm({ ...reviewForm, author_name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">만족도 별점</label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star size={32} className={star <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} />
                                </button>
                            ))}
                            <span className="ml-2 font-bold text-slate-700">{reviewForm.rating}점</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">리뷰 내용</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="다녀오신 투어의 소중한 경험을 들려주세요!"
                            value={reviewForm.content}
                            onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none font-medium"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">사진 첨부 (최대 5장)</label>
                        <input
                            type="file"
                            multiple
                            accept="image/png, image/jpeg, image/webp"
                            onChange={(e) => {
                                if (e.target.files) {
                                    const files = Array.from(e.target.files);
                                    if (files.length > 5) {
                                        alert("사진은 최대 5장까지만 선택할 수 있습니다.");
                                        e.target.value = '';
                                    } else {
                                        setReviewForm({ ...reviewForm, images: files });
                                    }
                                }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {reviewForm.images && reviewForm.images.length > 0 && (
                            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                {reviewForm.images.map((img, idx) => (
                                    <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                                        <img src={previewUrls[idx] || ''} alt="preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => setReviewForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                            className="absolute top-0 right-0 flex items-center justify-center bg-black/50 text-white w-5 h-5 cursor-pointer hover:bg-black/70 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmittingReview}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                        >
                            {isSubmittingReview ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                            {isSubmittingReview ? "등록 중..." : "리뷰 등록하기"}
                        </button>
                    </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tour Details Modal Popup */}
        {expandedTourDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6 animate-in fade-in duration-200">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setExpandedTourDetails(null)}></div>
             <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                 {/* Modal Header */}
                 <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                     <h3 className="text-lg sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                         <Info className="text-blue-500 hidden sm:block" size={24} />
                         {expandedTourDetails.tour_id === 'private' ? '[단독] 프라이빗 와이키키 거북이 스노클링' : expandedTourDetails.name} 상세 정보
                     </h3>
                     <button onClick={() => setExpandedTourDetails(null)} className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors shadow-sm border border-slate-200">
                         <X size={20} />
                     </button>
                 </div>
                 {/* Modal Body / Scrollable */}
                 <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-50">
                     {expandedTourDetails.is_combined || expandedTourDetails.tour_id?.toLowerCase().includes('morning') || expandedTourDetails.tour_id?.toLowerCase().includes('sunset') || (typeof expandedTourDetails.name === 'string' && expandedTourDetails.name.includes('선셋')) ? (
                         <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 sm:p-6">
                             <TourCourseTimeline isSunset={(typeof expandedTourDetails.name === 'string' && expandedTourDetails.name.includes('선셋')) || expandedTourDetails.tour_id?.toLowerCase().includes('sunset')} />
                         </div>
                     ) : (
                         <div className="min-h-[40vh] sm:min-h-[50vh] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-white p-6">
                             <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                 <ClipboardList size={32} opacity={0.5} />
                             </div>
                             <p className="font-bold text-slate-700 text-lg sm:text-xl mb-2 text-center">상세 정보가 아직 입력되지 않았습니다.</p>
                             <p className="text-slate-500 text-sm text-center max-w-md leading-relaxed px-4">
                                 관리자님, 나중에 이곳에 투어 스케줄, 코스 다이어그램, 준비물, 주의사항, 수많은 사진들을 마음껏 올릴 수 있습니다. (상하 스크롤이 자유로운 넓은 영역입니다!)
                             </p>
                         </div>
                     )}
                 </div>
                 {/* Modal Footer */}
                 <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-3">
                     <button onClick={() => setExpandedTourDetails(null)} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors w-full sm:w-auto text-center">
                         닫기
                     </button>
                     <button 
                        onClick={() => { 
                            const tId = expandedTourDetails.tour_id;
                            setExpandedTourDetails(null);
                            if(tId !== 'combined_morning' && tId) setSelectedTour(tId);
                            else setSelectedTour(null);
                            if(expandedTourDetails.is_flat_rate) form.setValue("childCount", 0); 
                            setIsBookingOpen(true); 
                        }} 
                        className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 w-full sm:w-auto text-center"
                     >
                         이 상품으로 예약하기
                     </button>
                 </div>
             </div>
          </div>
        )}

    </div>
  );
}
