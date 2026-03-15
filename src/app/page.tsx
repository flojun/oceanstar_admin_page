"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, MapPin, Calendar, Users, CreditCard, Loader2, ChevronRight, Info, X, ShieldCheck, Star, Anchor, UsersRound, Award, MessageSquare, User, ClipboardList, AlertTriangle, Mail } from "lucide-react";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { calculateDistance, findClosestPickup, PickupLocation, getWalkingMinutes } from '@/lib/utils';
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse } from "date-fns";
import Image from "next/image";
import FAQSection from "@/components/FAQSection";

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
  const [reviewForm, setReviewForm] = useState({ order_id: '', author_name: '', rating: 5, content: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // ==== 취소 요청 상태 ====
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelForm, setCancelForm] = useState({ order_id: '', booker_name: '' });
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

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
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });
      const data = await res.json();
      if (data.success) {
        alert("리뷰가 성공적으로 등록되었습니다. 감사합니다!");
        setReviewForm({ order_id: '', author_name: '', rating: 5, content: '' });
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

  const onCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('정말로 예약 취소를 환불 규정에 따라 요청하시겠습니까?')) {
        return;
    }
    setIsSubmittingCancel(true);
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancelForm)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "취소 요청이 접수되었습니다. 관리자 확인 후 처리됩니다.");
        setCancelForm({ order_id: '', booker_name: '' });
        setIsCancelOpen(false);
      } else {
        alert(data.error || "취소 요청 중 오류가 발생했습니다.");
      }
    } catch (e) {
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingCancel(false);
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
      setIsLoadingAvailability(true);
      setTimeout(() => setIsLoadingAvailability(false), 300);
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200 selection:text-blue-900">
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
      <header className="bg-white/80 backdrop-blur-md px-6 py-4 fixed top-0 w-full z-40 shadow-sm border-b border-white/20">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black text-blue-600 tracking-tighter uppercase drop-shadow-sm">Ocean Star</h1>
          <button 
             onClick={() => setIsBookingOpen(true)}
             className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm shadow-md transition-all sm:block hidden">
             투어 예약하기
          </button>
        </div>
      </header>

      <main className="w-full pb-32 pt-16">
        {/* === 1. Hero Section === */}
        <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          {/* Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-900/40 to-slate-900/80 z-10"></div>
          {/* Background Image (Placholder for gorgeous turtle/ocean pic) */}
          <div className="absolute inset-0 bg-blue-500">
             {/* <Image src="/hawaii-turtle-hero.jpg" alt="하와이 거북이 스노클링 오션스타" fill className="object-cover" priority /> */}
          </div>
          
          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
             <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-sm font-bold uppercase tracking-widest mb-6 animate-fade-in-up">
               Original Hawaii Tour
             </span>
             <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg animate-fade-in-up animation-delay-100 break-keep">
                하와이 최초! 
                <br className="md:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200"> 거북이 스노클링 원조,</span>
                <br /> 오션스타!
             </h1>
             <p className="text-lg md:text-xl text-blue-50 font-medium mb-10 max-w-2xl mx-auto drop-shadow-md leading-relaxed animate-fade-in-up animation-delay-200">
                연 2만명 이상의 고객들과 13,000개의 누적 후기가 입증하는 하와이 단연 1위 거북이 스노클링 전문 업체! 가장 재밌고 특별한 경험을 함께 하세요!
             </p>
             <button 
                onClick={() => setIsBookingOpen(true)}
                className="bg-white text-blue-800 hover:bg-blue-50 hover:scale-105 transition-all px-8 py-4 rounded-full font-extrabold text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] animate-fade-in-up animation-delay-300">
                지금 예약하고 최저가 보장받기
             </button>
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-30">
        
          {/* === 2. Bento Box Introduction === */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
            <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col justify-center transform hover:-translate-y-1 transition duration-500">
              <Award className="w-10 h-10 text-amber-500 mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Since 2019, 오리지널</h3>
              <p className="text-slate-600 text-lg">한국인 대상 거북이 스노클링 하와이 최초 · 업계 유일무이 찐 원조.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 shadow-xl text-white flex flex-col justify-center items-start transform hover:-translate-y-1 transition duration-500">
              <Star className="w-10 h-10 text-yellow-300 mb-4 fill-yellow-300" />
              <h3 className="text-4xl font-extrabold mb-1">13,000+</h3>
              <p className="text-blue-100 font-medium text-lg mb-2">누적 리뷰 (업계 최다)</p>
              <p className="text-sm text-blue-200">압도적인 신뢰와 만족도</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 transform hover:-translate-y-1 transition duration-500">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">거북이 100% 보장제</h3>
              <p className="text-slate-600 font-medium">자연산 바다 거북이를 만나지 못하면 100% 환불 또는 재탑승을 보장합니다.</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 transform hover:-translate-y-1 transition duration-500">
              <Anchor className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">51인승 루프탑 보트</h3>
              <p className="text-slate-600 font-medium">와이키키 유일! 자외선·비 100% 차단, 흔들림을 최소화하여 멀미 없는 쾌적함.</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 transform hover:-translate-y-1 transition duration-500">
              <UsersRound className="w-10 h-10 text-purple-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">전문 자격 한인 크루</h3>
              <p className="text-slate-600 font-medium">수영을 전혀 못해도, 영어를 전혀 못해도 괜찮습니다! 전원 자격증 소지 한국인 크루 상주.</p>
            </div>
          </section>

          {/* === 3. Tour Packages (Cards) === */}
          <section className="mb-10">
            <div className="text-center mb-12">
               <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">오션스타 추천 프로그램</h2>
               <p className="text-lg text-slate-500">당신의 완벽한 하와이 여행을 위한 최고의 선택</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {tourSettings.filter((t: any) => t.is_active !== false).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)).map((tour: any, idx: number) => {
                  const isPrivate = tour.is_flat_rate && tour.tour_id === 'private';
                  const isSunset = tour.tour_id?.toLowerCase().includes('sunset');
                  
                // Dynamic styles based on index or properties
                  const themes: { bg: string, gradient: string, text: string, badge: string, btn: string, specialLabel?: string, isDark?: boolean }[] = [
                    { bg: 'bg-cyan-100', gradient: 'from-cyan-500 to-blue-400', text: 'text-blue-900', badge: '🌊 가장 인기있는 액티비티', btn: 'bg-slate-900 hover:bg-slate-800', isDark: false },
                    { bg: 'bg-orange-100', gradient: 'from-orange-400 to-rose-400', text: 'text-orange-900', badge: '🌅 로맨틱 선셋 뷰', btn: 'bg-orange-500 hover:bg-orange-600', specialLabel: '커플/신혼 여행객 추천!', isDark: false },
                    { bg: 'bg-indigo-100', gradient: 'from-indigo-500 to-purple-500', text: 'text-indigo-900', badge: '✨ 프리미엄 투어', btn: 'bg-indigo-600 hover:bg-indigo-700', isDark: false }
                  ];
                  
                  // Use theme based on index or special cases
                  let theme = themes[idx % themes.length];
                  if (isPrivate) theme = { bg: 'bg-slate-800', gradient: 'from-slate-800 to-indigo-900', text: 'text-white', badge: '🛥️ VVIP 단독 보트 대관', btn: 'bg-indigo-500 hover:bg-indigo-400', isDark: true };
                  else if (isSunset) theme = themes[1];

                  return (
                    <div key={tour.tour_id} className={`${theme.isDark ? 'bg-slate-900 text-white' : 'bg-white'} ${isPrivate ? 'md:col-span-2 lg:col-span-3 max-w-[420px] w-full mx-auto' : ''} rounded-3xl shadow-lg border ${theme.isDark ? 'border-slate-800' : 'border-slate-100'} overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2 flex flex-col group relative`}>
                      {theme.specialLabel && (
                        <div className="absolute top-0 right-10 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-b-xl z-10 shadow-md">
                          {theme.specialLabel}
                        </div>
                      )}
                      <div className={`h-48 ${theme.bg} relative overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-tr ${theme.gradient} group-hover:scale-105 transition-transform duration-500`} />
                        <div className={`absolute bottom-4 left-4 ${theme.isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white/90 text-' + theme.text} backdrop-blur text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                          {theme.badge}
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className={`text-2xl font-bold ${theme.isDark ? 'text-white' : 'text-slate-800'} mb-3`}>{tour.name}</h3>
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
                              <li className="flex items-start gap-2">
                                <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                {tour.is_flat_rate ? '인원수 연동 맞춤형 요금 적용' : `${tour.start_time?.slice(0,5) || '07:30'} - ${tour.end_time?.slice(0,5) || '14:30'}`}
                              </li>
                           </ul>
                        </div>
                        <div className={`flex items-end justify-between border-t ${theme.isDark ? 'border-slate-700' : 'border-slate-100'} pt-6`}>
                          <div>
                            <p className="text-xs text-slate-400 font-medium">
                              {tour.is_flat_rate ? (tour.tour_id === 'private' ? '1~4인 기준 (인원별 상이)' : `최대 ${tour.max_capacity}인 기준`) : '성인가 기준 (24개월 미만 무료)'}
                            </p>
                            <p className={`text-2xl font-black ${theme.isDark ? 'text-indigo-400' : (isSunset ? 'text-orange-600' : 'text-blue-600')}`}>
                              {tour.is_flat_rate && tour.tour_id === 'private' ? (
                                <>단독 대관 ₩{Math.floor(calculateTieredPrivatePrice(1, (tour.adult_price_krw / (tour.adult_price_usd || 1)))).toLocaleString()} ~</>
                              ) : (
                                <>₩{Math.floor(tour.adult_price_krw || 0).toLocaleString()}{tour.is_flat_rate ? ' / 팀' : ''}</>
                              )}
                            </p>
                          </div>
                          <button onClick={() => setIsBookingOpen(true)} className={`${theme.btn} text-white px-5 py-2.5 rounded-xl font-bold transition-colors`}>예약하기</button>
                        </div>
                      </div>
                    </div>
                  );
               })}
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
                            <p className="text-slate-700 italic flex-1 whitespace-pre-wrap leading-relaxed text-sm">
                                "{review.content}"
                            </p>
                            <div className="border-t border-slate-100 mt-6 pt-4 flex items-center gap-3">
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
        </section>

        {/* === FAQ Section === */}
        <FAQSection />

        {/* === 6. Cancellation and Refund Policy (Footer) === */}
        <section className="bg-slate-900 text-slate-300 py-16 mt-20 relative z-30 pb-32">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">취소 및 환불 규정</h2>
                <p className="text-slate-400">대박하와이 (Waikiki Turtle Snorkel) | 하와이 현지 시간 기준 · 모든 상품 공통 적용</p>
             </div>
             
             <div className="space-y-8 text-sm md:text-base">
                <div>
                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-blue-400" /> 기본 환불 규정</h3>
                   <ul className="space-y-3 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                      <li className="flex items-start gap-3">
                         <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✅ [전액 환불]</span>
                         <span>투어 시작 <strong>7일 전</strong>까지 취소 통보 시</span>
                      </li>
                      <li className="flex items-start gap-3">
                         <span className="text-yellow-400 font-bold shrink-0 mt-0.5">⚠️ [50% 공제 후 환불]</span>
                         <span>투어 시작 <strong>6~3일 전</strong> 취소 통보 시</span>
                      </li>
                      <li className="flex items-start gap-3">
                         <span className="text-rose-400 font-bold shrink-0 mt-0.5">❌ [환불 불가]</span>
                         <span>투어 시작 <strong>2일 전 ~ 당일</strong> 취소 통보 또는 노쇼(No-Show) 시 (100% 취소 수수료 적용)</span>
                      </li>
                   </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                       <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-yellow-400" /> 추가 특약 사항</h3>
                       <div className="space-y-4">
                           <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50">
                               <h4 className="font-bold text-white mb-2 text-sm">🌧 날씨 관련</h4>
                               <ul className="list-disc ml-5 space-y-1 text-slate-400 text-sm">
                                   <li>가벼운 비·바람·우천 시에도 와이키키 유일 루프탑 보트로 정상 진행합니다.</li>
                                   <li>태풍·극심한 악천후·해안경비대 출항 금지 등 안전상 취소 시 <strong>전액 환불 또는 날짜 변경 가능</strong> (고객 선택)</li>
                               </ul>
                           </div>
                           <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50">
                               <h4 className="font-bold text-white mb-2 text-sm">🛥 프라이빗 / 단체 예약</h4>
                               <ul className="list-disc ml-5 space-y-1 text-slate-400 text-sm">
                                   <li>위 일반 규정이 동일하게 적용됩니다.</li>
                                   <li>별도 계약 체결 시 조정 가능하오니 사전에 문의해 주세요.</li>
                               </ul>
                           </div>
                       </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                           <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Mail size={20} className="text-blue-400" /> 취소 요청 방법</h3>
                           <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50">
                               <ul className="list-disc ml-5 space-y-2 text-slate-400 text-sm">
                                   <li>예약 플랫폼 내 취소 버튼 또는 이메일·채팅으로 요청</li>
                                   <li>영업시간 내 접수된 건에 한해 처리됩니다.</li>
                                   <li className="text-slate-300 font-medium list-none -ml-5 mt-2 flex items-center gap-2">
                                       <span className="bg-slate-700 px-2 py-1 rounded text-xs">영업시간</span>
                                       하와이 현지 기준 월~금 09:00~17:00
                                   </li>
                               </ul>
                           </div>
                        </div>

                        <div>
                           <div className="bg-blue-900/20 p-5 rounded-2xl border border-blue-900/50">
                               <h4 className="font-bold text-blue-300 mb-2 flex items-center gap-2 text-sm"><Info size={16} /> 법적 고지</h4>
                               <p className="text-xs text-blue-100/70 leading-relaxed">
                                   본 규정은 국외여행 표준약관 제6조(특약)에 따르며, 일반 소비자분쟁해결기준과 다를 수 있습니다. 예약 전 반드시 확인하세요.
                               </p>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                   <button onClick={() => setIsCancelOpen(true)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-slate-700 hover:border-slate-500 shadow-lg flex items-center gap-2">
                       <AlertTriangle size={18} className="text-rose-400" /> 직접 예약 취소 요청하기
                   </button>
                </div>
             </div>

             <div className="border-t border-slate-800 mt-12 pt-8 text-center">
                 <h4 className="text-white font-bold mb-2">대박하와이 (Waikiki Turtle Snorkel)</h4>
                 <p className="text-slate-500 text-sm">하와이 한인 최초 거북이 스노클링 원조<br/>마이리얼트립 6,500 리뷰 · 구글 5,000 리뷰</p>
             </div>
          </div>
        </section>

        {/* 플로팅 예약 버튼 (모달 열기) */}
        {!isBookingOpen && !isReviewOpen && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 flex justify-center">
            <div className="max-w-[1600px] w-full flex justify-between items-center px-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">하와이 단연 1위</p>
                <p className="text-xl font-extrabold text-blue-600">최고의 스노클링 투어 예약</p>
              </div>
              <button
                onClick={() => setIsBookingOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/30 transition-transform active:scale-95 flex items-center gap-2"
              >
                예약 진행하기 <ChevronRight size={18} />
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
                              {tour.is_flat_rate ? `최대 ${tour.max_capacity}인 단독 대관` : `${tour.start_time || '오전'} - ${tour.end_time || '(종료 미정)'}`}
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
                                        {loc.name}
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

        {/* === 취소 요청 플로팅 모달 (Cancel Request Modal) === */}
        {isCancelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCancelOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="text-rose-500" /> 예약 취소 요청
                </h2>
                <button onClick={() => setIsCancelOpen(false)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl mb-6">
                    <p className="text-sm font-bold text-rose-800 mb-1">⚠️ 취소 요청 전 주의사항</p>
                    <p className="text-xs text-rose-700 leading-relaxed">
                        접수 즉시 예약이 취소되는 것이 아니며, <strong>'취소요청' 상태로 변경</strong>됩니다. 관리자가 취소 패널티 규정(100%, 50%, 0%)을 확인한 후 카드 환불 등 최종 처리를 진행합니다. 
                    </p>
                </div>

                <form onSubmit={onCancelSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">예약 번호 (영숫자 6자리)</label>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="예: A4X9T2"
                            value={cancelForm.order_id}
                            onChange={(e) => setCancelForm({ ...cancelForm, order_id: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all uppercase tracking-widest font-mono font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">예약자 성함</label>
                        <input
                            type="text"
                            required
                            placeholder="예약하신 분의 성함을 입력해주세요"
                            value={cancelForm.booker_name}
                            onChange={(e) => setCancelForm({ ...cancelForm, booker_name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmittingCancel}
                            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
                        >
                            {isSubmittingCancel ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                            {isSubmittingCancel ? "처리 중..." : "취소 요청 제출하기"}
                        </button>
                    </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
