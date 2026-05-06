"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, MapPin, Calendar, Users, CreditCard, Loader2, ChevronRight, ChevronLeft, Info, X, ShieldCheck, Star, Anchor, UsersRound, Award, MessageSquare, User, ClipboardList, AlertTriangle, Mail, Instagram, Youtube, Sparkles } from "lucide-react";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { calculateDistance, findClosestPickup, PickupLocation, getWalkingMinutes } from '@/lib/utils';
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse } from "date-fns";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { TourSetting } from "@/lib/tourUtils";
import FAQSection from "@/components/landing/FAQSection";
import PickupGuide from "@/components/landing/PickupGuide";
import TourCourseTimeline from "@/components/landing/TourCourseTimeline";
import { getPickupDisplayNameByLang } from '@/constants/pickupLocations';
import ImageCarousel from "@/components/landing/ImageCarousel";
import { getTranslation, setLanguageCookie, type Language } from "@/lib/translations";
import CurrencySelectModal from "@/components/payment/CurrencySelectModal";
import VideoPopupModal from "@/components/landing/VideoPopupModal";

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
    if (totalPax <= 10) usdPrice = 1200;
    else if (totalPax <= 20) usdPrice = 1800;
    else if (totalPax <= 30) usdPrice = 2400;
    else usdPrice = 3000; // max 40

    // Do not round or use Math.round, use exact multiplied value
    return Math.floor(usdPrice * exchangeRate); 
};

export default function ReservationClientPage({ lang }: { lang: Language }) {
  const t = getTranslation(lang);
  const [selectedTour, setSelectedTour] = useState<string | null>(null);
  const [expandedTourDetails, setExpandedTourDetails] = useState<TourSetting | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [closestPickup, setClosestPickup] = useState<{ location: PickupLocation, minutes: number } | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<z.infer<typeof formSchema> | null>(null);
  const infoSectionRef = useRef<HTMLElement>(null);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availabilities, setAvailabilities] = useState<Record<string, { booked: number, remaining: number, isAvailable: boolean }>>({});
  const [maxCapacity, setMaxCapacity] = useState(45);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [tourSettings, setTourSettings] = useState<TourSetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ date: string; tour_id: string; reason: string | null }[]>([]);

  // ==== 리뷰 상태 ====
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState<{ order_id: string; author_name: string; rating: number; content: string; images: File[] }>({ order_id: '', author_name: '', rating: 5, content: '', images: [] });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const reviewScrollRef = useRef<HTMLDivElement>(null);

  const scrollReviews = (direction: 'left' | 'right') => {
    if (reviewScrollRef.current) {
      const scrollAmount = reviewScrollRef.current.clientWidth * 0.8;
      reviewScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
        alert(lang === 'en' ? "You can upload up to 5 photos." : "사진은 최대 5장까지만 업로드 가능합니다.");
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
        alert(lang === 'en' ? "Review submitted successfully. Thank you!" : "리뷰가 성공적으로 등록되었습니다. 감사합니다!");
        setReviewForm({ order_id: '', author_name: '', rating: 5, content: '', images: [] });
        setIsReviewOpen(false);
        fetchReviews();
      } else {
        alert(data.error || (lang === 'en' ? "An error occurred while submitting." : "리뷰 등록 중 오류가 발생했습니다."));
      }
    } catch (e) {
      alert(lang === 'en' ? "Communication error with server." : "서버와 통신 중 오류가 발생했습니다.");
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
    if (lang === 'en') {
        return type === 'adult' ? (setting.adult_price_usd || 0) : (setting.child_price_usd || 0);
    }
    return type === 'adult' ? setting.adult_price_krw : setting.child_price_krw;
  };

  const currentAdultPrice = selectedTour ? getPriceForTour(selectedTour, 'adult') : (lang === 'en' ? (tourSettings[0]?.adult_price_usd || 100) : (tourSettings[0]?.adult_price_krw || 135000));
  const currentChildPrice = selectedTour ? getPriceForTour(selectedTour, 'child') : (lang === 'en' ? (tourSettings[0]?.child_price_usd || 80) : (tourSettings[0]?.child_price_krw || 108000));

  // Calculate Total Price dynamically
  let totalPrice = 0;
  if (isFlatRate && selectedTour === 'private') {
     const exchangeRate = lang === 'en' ? 1 : (selectedTourSetting?.adult_price_usd ? ((selectedTourSetting.adult_price_krw || 0) / selectedTourSetting.adult_price_usd) : 1350);
     totalPrice = calculateTieredPrivatePrice(totalSelectedPax, exchangeRate);
  } else if (isFlatRate) {
     totalPrice = currentAdultPrice || 0;
  } else {
     totalPrice = (adultCount * (currentAdultPrice || 0)) + (childCount * (currentChildPrice || 0));
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedTour) {
      alert(t('bookingModal.alert_selectTour'));
      return;
    }

    setPendingBookingData(values);
    setIsCurrencyModalOpen(true);
  };

  const processPayment = async (type: 'KRW' | 'USD') => {
    if (!pendingBookingData || !selectedTour) return;

    if (type === 'KRW') {
        // 기존 한화 결제 로직은 건드리지 않고 버튼만 만들어달라는 요청에 따라 알림만 띄우거나,
        // 원할 경우 기존 Pay2Pay를 바로 실행하도록 할 수 있습니다. 
        // 일단 기존 작동하던 Pay2Pay 로직을 그대로 유지합니다.
        console.log("KRW payment selected");
    }

    setIsSubmitting(true);
    setIsCurrencyModalOpen(false);
    try {
      const formattedDate = format(pendingBookingData.tourDate, "yyyy-MM-dd");
      const endpoint = type === 'USD' ? '/api/stripe/checkout' : '/api/pay2pay/checkout';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedTour,
          pickupLocationId: closestPickup?.location?.id,
          pickupLocationName: closestPickup?.location?.name || '',
          totalPrice,
          ...pendingBookingData,
          tourDate: formattedDate,
          lang: lang
        })
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        // 기존 PG사 응답
        window.location.href = data.redirectUrl;
      } else if (data.url) {
        // Stripe Checkout 세션 응답
        window.location.href = data.url;
      } else {
        alert((lang === 'en' ? "Payment error: " : "결제 준비 중 오류가 발생했습니다: ") + (data.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert(lang === 'en' ? "Server communication error." : "서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white text-slate-800 font-sans selection:bg-blue-200 selection:text-blue-900">
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
      <VideoPopupModal lang={lang} />
      <header className={`w-full z-40 transition-all duration-300 bg-white/80 backdrop-blur-md shrink-0 ${isScrolled ? 'shadow-sm border-b border-slate-200' : 'border-b border-transparent'}`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[10px] sm:text-[11.5px] font-bold text-blue-500/90 tracking-widest leading-none mb-1">{t('header.subtitle')}</span>
            <h1 className="text-[22px] sm:text-2xl font-black text-blue-600 tracking-tighter uppercase drop-shadow-sm leading-none">OceanStar</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
             <button
                onClick={() => {
                   const targetLang = lang === 'ko' ? 'en' : 'ko';
                   setLanguageCookie(targetLang);
                   window.location.href = targetLang === 'en' ? '/en' : '/';
                }}
                className="bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-[11.5px] sm:text-sm shadow-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
             >
                <img 
                   src={lang === 'ko' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/kr.png"} 
                   alt={lang === 'ko' ? "English" : "한국어"} 
                   className="w-5 h-auto sm:w-6 object-contain rounded-[2px]"
                />
                <span>{lang === 'ko' ? 'EN' : 'KR'}</span>
             </button>
             <Link 
                href={lang === 'en' ? '/en/manage-booking' : '/manage-booking'}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold text-[11.5px] sm:text-sm shadow-sm transition-all whitespace-nowrap shrink-0">
                {t('header.manageBooking')}
             </Link>
             <button 
                onClick={() => setIsBookingOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm shadow-md transition-all sm:block hidden whitespace-nowrap">
                {t('header.bookNow')}
             </button>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="w-full flex-1 overflow-y-auto pb-0 bg-white">
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
               {t('hero.badge')}
             </span>
             <h1 className={`font-extrabold text-white leading-tight sm:leading-tight drop-shadow-2xl animate-fade-in-up animation-delay-100 ${lang === 'ko' ? 'text-[2.8rem] break-keep' : 'text-3xl break-words'} sm:text-4xl md:text-5xl lg:text-6xl`}>
                {lang === 'ko' ? (
                  <>{t('hero.title1')}<br/>{t('hero.title2')}<br className="sm:hidden" /><span className="hidden sm:inline"> </span>{t('hero.title3')}</>
                ) : (
                  <>{t('hero.title1')}{t('hero.title1') ? <br/> : null}{t('hero.title2')}{t('hero.title3')}</>
                )}
             </h1>
          </div>

          {/* Bottom Text Content & Button */}
          <div className="absolute bottom-0 left-0 right-0 z-20 text-center px-4 pb-24 sm:pb-28 lg:pb-32 max-w-4xl mx-auto flex flex-col items-center">
             <p className={`text-sm sm:text-base md:text-xl text-white font-medium mb-4 sm:mb-8 drop-shadow-lg leading-relaxed animate-fade-in-up animation-delay-200 max-w-[90%] sm:max-w-none ${lang === 'en' ? 'break-words' : 'break-keep'}`}>
                {lang === 'ko' ? (
                  <>{t('hero.desc1')}<br />{t('hero.desc2')}</>
                ) : (
                  <>{t('hero.desc1')} {t('hero.desc2')}</>
                )}
             </p>
             <button 
                onClick={() => setIsBookingOpen(true)}
                className="bg-white text-blue-800 hover:bg-blue-50 hover:scale-105 transition-all px-5 py-2.5 sm:px-8 sm:py-4 rounded-full font-bold tracking-tight text-[15px] sm:text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] animate-fade-in-up animation-delay-300"
                style={{ fontFamily: "'Inter', 'Pretendard', -apple-system, sans-serif" }}>
                {t('hero.mainBtn')}
             </button>
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-20 relative z-30">
        
          {/* === 2. Bento Box Introduction === */}
          <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-12 sm:mb-20">
            <div className="bg-white rounded-3xl p-6 lg:p-7 shadow-xl border border-slate-100 flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <Award className="w-10 h-10 text-amber-500 mb-4 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-2 break-keep">{t('bento.desc1_title')}</h3>
              <p className="text-slate-600 font-medium text-base leading-relaxed break-keep">{t('bento.desc1_text')}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 lg:p-7 shadow-xl text-white flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <Star className="w-10 h-10 text-yellow-300 mb-4 fill-yellow-300 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-white mb-2 break-keep">{t('bento.desc2_title')}</h3>
              <p className="text-blue-100 font-medium text-base leading-relaxed break-keep">{t('bento.desc2_text')}</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 lg:p-7 shadow-xl border border-slate-100 flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-2 break-keep">{t('bento.desc3_title')}</h3>
              <p className="text-slate-600 font-medium text-base leading-relaxed break-keep">{t('bento.desc3_text')}</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 lg:p-7 shadow-xl border border-slate-100 flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <Anchor className="w-10 h-10 text-blue-500 mb-4 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-2 break-keep">{t('bento.desc4_title')}</h3>
              <p className="text-slate-600 font-medium text-base leading-relaxed break-keep">{t('bento.desc4_text')}</p>
            </div>
            
            <div className="bg-white rounded-3xl p-6 lg:p-7 shadow-xl border border-slate-100 flex flex-col justify-start transform hover:-translate-y-1 transition duration-500">
              <UsersRound className="w-10 h-10 text-purple-500 mb-4 shrink-0" />
              <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-2 break-keep">{t('bento.desc5_title')}</h3>
              <p className="text-slate-600 font-medium text-base leading-relaxed break-keep">{t('bento.desc5_text')}</p>
            </div>
          </section>

          {/* === 3. Tour Packages (Cards) === */}
          <section className="mb-10">
            <div className="text-center mb-12">
               <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('tour.title')}</h2>
               <p className="text-lg text-slate-500">{t('tour.subtitle')}</p>
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

                  displayCards = displayCards.map((tItem: any) => {
                    if (tItem.tour_id?.toLowerCase().includes('sunset')) return { ...tItem, name: <span className="block text-center leading-snug whitespace-pre-wrap">{lang === 'ko' ? t('tour.names.sunset').replace('와이키키 ', '와이키키\n') : t('tour.names.sunset')}</span> };
                    if (tItem.tour_id === 'private') return { ...tItem, name: <span className="block text-center leading-snug whitespace-pre-wrap">{lang === 'ko' ? t('tour.names.private').replace('] ', ']\n').replace('거북이 ', '거북이\n') : t('tour.names.private').replace('] ', ']\n')}</span> };
                    if (tItem.is_combined || tItem.tour_id?.toLowerCase().includes('morning')) return { ...tItem, name: t('tour.names.combined') };
                    return tItem;
                  });

                  return displayCards.map((tour: any, idx: number) => {
                    const isPrivate = tour.is_flat_rate && tour.tour_id === 'private';
                    const isSunset = tour.tour_id?.toLowerCase().includes('sunset');
                    
                    const themes: { bg: string, gradient: string, text: string, badge: string, btn: string, specialLabel?: React.ReactNode, specialLabelBg?: string, isDark?: boolean }[] = [
                      { bg: 'bg-cyan-100', gradient: 'from-cyan-500 to-blue-400', text: 'text-blue-900', badge: t('tour.badges.popular'), btn: 'bg-slate-900 hover:bg-slate-800', isDark: false },
                      { bg: 'bg-orange-100', gradient: 'from-orange-400 to-rose-400', text: 'text-orange-900', badge: t('tour.badges.morning'), btn: 'bg-orange-500 hover:bg-orange-600', isDark: false },
                      { bg: 'bg-indigo-100', gradient: 'from-indigo-500 to-purple-500', text: 'text-indigo-900', badge: t('tour.badges.premium'), btn: 'bg-indigo-600 hover:bg-indigo-700', isDark: false }
                    ];
                    
                    let theme = themes[idx % themes.length];
                    if (isPrivate) theme = { bg: 'bg-slate-900', gradient: 'from-slate-800 to-indigo-900', text: 'text-white', badge: t('tour.badges.private'), btn: 'bg-indigo-500 hover:bg-indigo-400', specialLabel: <span className="flex items-center gap-1"><Sparkles size={14} className="text-yellow-300 fill-yellow-300" /> {lang === 'en' ? 'Opening Special' : '오픈특가'} <Sparkles size={14} className="text-yellow-300 fill-yellow-300" /></span>, specialLabelBg: 'bg-gradient-to-r from-fuchsia-600 to-purple-600', isDark: true };
                    else if (isSunset) theme = { bg: 'bg-orange-100', gradient: 'from-orange-400 to-rose-400', text: 'text-orange-900', badge: t('tour.badges.sunset'), btn: 'bg-orange-500 hover:bg-orange-600', specialLabel: t('tour.badges.couple'), specialLabelBg: 'bg-gradient-to-r from-orange-400 to-red-500', isDark: false };

                      const tourImages = (() => {
                        if (isSunset) {
                          return [
                            { src: '/images_option_card/sunset.jpg' },
                            { src: '/images_option_card/snorkeling_turtle2.jpg', style: { objectPosition: 'center 20%', transform: 'rotate(-0.68deg) scale(1.08)' } },
                            { src: '/images_option_card/kayak_sunset.jpg', style: { transform: 'rotate(1.64deg) scale(1.1)' } },
                            { src: '/images_option_card/sunset_people.jpg', style: { objectPosition: 'right center', transform: 'rotate(0.91deg) scale(1.08)' } }
                          ];
                        } else {
                          return [
                            { src: '/images_option_card/snorkeling_turtle.jpg', style: { transform: 'rotate(-6deg) scale(1.3)' } },
                            { src: '/images_option_card/paddleboad_people.jpg', style: { objectPosition: 'center 80%', transform: 'rotate(-1.12deg) scale(1.1)' } },
                            { src: '/images_option_card/snorkeling_turtle2.jpg', style: { objectPosition: 'center 20%', transform: 'rotate(-0.68deg) scale(1.08)' } },
                          ];
                        }
                      })();

                    return (
                      <div key={tour.tour_id} className={`${theme.isDark ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100'} flex-col rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2 flex group relative`}>
                        {theme.specialLabel && (
                          <div className={`absolute top-0 right-10 ${theme.specialLabelBg || 'bg-gradient-to-r from-orange-400 to-red-500'} text-white text-xs font-bold px-4 py-1.5 rounded-b-xl z-10 shadow-md`}>
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
                            {lang === 'en' ? (tour.description_en || "Enjoy the best snorkeling tour in Waikiki with OceanStar. Guaranteed safe and fun time with professional guides.") : (tour.description || "와이키키 최고의 투어를 오션스타와 함께하세요. 전문가의 안내로 안전하고 즐거운 시간을 보장합니다.")}
                          </p>
                          <div className={`${theme.isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} p-4 rounded-2xl mb-6 border`}>
                            <ul className={`space-y-2 text-sm ${theme.isDark ? 'text-slate-300' : 'text-slate-700'} font-medium`}>
                                <li className="flex items-start gap-2">
                                  <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                  {tour.is_flat_rate ? t('tour.features.private_only').replace('{max}', tour.max_capacity) : t('tour.features.snorkeling_5')}
                                </li>
                                <li className="flex items-start gap-2">
                                  <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                  {tour.is_flat_rate ? t('tour.features.customizable') : t('tour.features.equip_snacks')}
                                </li>
                                {isSunset && (
                                  <li className="flex items-start gap-2">
                                    <Check className="text-emerald-500 w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{t('tour.features.cheese_wine')}</span>
                                  </li>
                                )}
                                {tour.is_combined ? (
                                  <>
                                    <li className="flex items-start gap-2">
                                      <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                      <span>{t('tour.features.time_1')}</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                      <span>{t('tour.features.time_2')}</span>
                                    </li>
                                  </>
                                ) : (
                                  <li className="flex items-start gap-2">
                                    <Check className={`${theme.isDark ? 'text-indigo-400' : 'text-emerald-500'} w-4 h-4 mt-0.5 shrink-0`} /> 
                                    <div className="flex flex-col gap-1">
                                      {tour.is_flat_rate ? (
                                        <span>{t('tour.features.custom_price')}</span>
                                      ) : (
                                        <span>{isSunset ? t('tour.details.time_variable') : t('tour.features.time_format').replace('{start}', tour.start_time?.slice(0,5) || '07:30').replace('{end}', tour.end_time?.slice(0,5) || '14:30')}</span>
                                      )}
                                    </div>
                                  </li>
                                )}
                                {!tour.is_flat_rate && lang === 'en' && (
                                  <li className="flex items-start gap-2">
                                    <Check className="text-emerald-500 w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{t('tour.features.pickup_service')}</span>
                                  </li>
                                )}
                            </ul>
                          </div>
                          <div className={`flex flex-wrap items-end justify-between border-t ${theme.isDark ? 'border-slate-700' : 'border-slate-100'} pt-6 gap-2`}>
                            <div className="flex-1 min-w-[60%]">
                              <p className="text-xs text-slate-400 font-medium">
                                {tour.is_flat_rate ? (tour.tour_id === 'private' ? t('tour.details.privatePax') : t('tour.details.maxPax').replace('{max}', tour.max_capacity)) : t('tour.details.adultPrice')}
                              </p>
                              <p className={`text-xl sm:text-2xl font-black truncate pr-2 ${theme.isDark ? 'text-indigo-400' : (isSunset ? 'text-orange-600' : 'text-blue-600')}`}>
                                {lang === 'en' ? (
                                  tour.is_flat_rate && tour.tour_id === 'private' ? (
                                    <>${Math.floor(calculateTieredPrivatePrice(1, 1)).toLocaleString()} ~</>
                                  ) : (
                                    <>${Math.floor(tour.adult_price_usd || 0).toLocaleString()}{tour.is_flat_rate ? ' / Team' : ''}</>
                                  )
                                ) : (
                                  tour.is_flat_rate && tour.tour_id === 'private' ? (
                                    <>₩{Math.floor(calculateTieredPrivatePrice(1, (tour.adult_price_krw / (tour.adult_price_usd || 1)))).toLocaleString()} ~</>
                                  ) : (
                                    <>₩{Math.floor(tour.adult_price_krw || 0).toLocaleString()}{tour.is_flat_rate ? ' / 팀' : ''}</>
                                  )
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-auto shrink-0 w-full sm:w-auto">
                                <button 
                                  onClick={() => setExpandedTourDetails(tour)} 
                                  className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap border-2 ${theme.isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'} flex justify-center items-center gap-1 active:scale-95`}
                                >
                                  {t('tour.seeDetails')}
                                </button>
                                <button onClick={() => { if(tour.tour_id !== 'combined_morning' && tour.tour_id) { setSelectedTour(tour.tour_id); } else { setSelectedTour(null); } if(tour.is_flat_rate) form.setValue("childCount", 0); setIsBookingOpen(true); }} className={`flex-1 sm:flex-none ${theme.btn} text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-transform active:scale-95 whitespace-nowrap shadow-[0_4px_14px_0_rgba(0,118,255,0.39)]`}>{t('tour.bookBtn')}</button>
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
                   <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('review.title')}</h2>
                   <p className="text-lg text-slate-500">{t('review.subtitle')}</p>
                </div>
                <button 
                   onClick={() => setIsReviewOpen(true)}
                   className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                   <MessageSquare size={18} />
                   {t('review.writeBtn')}
                </button>
            </div>

            {isLoadingReviews ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center text-slate-500 font-medium">
                    {t('review.empty')}
                </div>
            ) : (
                <div className="relative group">
                    <button 
                        onClick={() => scrollReviews('left')} 
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 sm:-ml-6 z-10 bg-white shadow-lg border border-slate-200 text-slate-800 w-12 h-12 rounded-full hover:bg-slate-50 hover:scale-105 transition-all hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-0"
                        aria-label="이전 리뷰"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={() => scrollReviews('right')} 
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 sm:-mr-6 z-10 bg-white shadow-lg border border-slate-200 text-slate-800 w-12 h-12 rounded-full hover:bg-slate-50 hover:scale-105 transition-all hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-0"
                        aria-label="다음 리뷰"
                    >
                        <ChevronRight size={24} />
                    </button>
                    <div 
                        ref={reviewScrollRef}
                        className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scroll" 
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <style dangerouslySetInnerHTML={{__html: `
                            .hide-scroll::-webkit-scrollbar { display: none; }
                        `}} />
                        {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col h-full shrink-0 w-[85vw] sm:w-[320px] lg:w-[350px] snap-center transform hover:-translate-y-1 transition duration-300">
                            <div className="flex items-center gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} />
                                ))}
                            </div>
                            <p className="text-slate-700 italic whitespace-pre-wrap leading-relaxed text-sm mb-4 font-medium flex-1">
                                "{lang === 'en' && review.content_en ? review.content_en : review.content}"
                            </p>
                            {review.image_urls && review.image_urls.length > 0 && (
                                <div className={`grid gap-2 mb-4 ${review.image_urls.length === 1 ? 'grid-cols-1' : review.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                    {review.image_urls.slice(0, 5).map((url: string, index: number) => (
                                        <div key={index} className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-50 shadow-sm flex items-center justify-center group">
                                            <Image 
                                              src={url} 
                                              alt={`스노클링 리뷰 이미지 ${index + 1}`} 
                                              fill 
                                              quality={90}
                                              className="object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110" 
                                              sizes="(max-width: 768px) 50vw, 33vw" 
                                              onClick={() => setLightboxImage(url)}
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
                        <p className="text-slate-600 font-medium">{t('review.google_desc1')}<strong className="text-slate-900">5,000+</strong>{t('review.google_desc2')}</p>
                    </div>
                </div>
                
                <a 
                    href="https://www.google.com/maps/search/?api=1&query=Ocean+Star+Hawaii" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full md:w-auto bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-3 shrink-0"
                >
                    {t('review.google_btn')} <ChevronRight size={18} />
                </a>
            </div>

            {/* YouTube Video Section */}
            <div className="mt-12">
                <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{t('review.video_title')}</h3>
                    <p className="text-base text-slate-500 mt-2">{t('review.video_subtitle')}</p>
                </div>
                <div className="relative w-full overflow-hidden rounded-3xl shadow-lg border border-slate-200 bg-black" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/HaxDMbuuJHE"
                        title="OceanStar Hawaii Turtle Snorkeling Tour"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </div>
            </div>
        </section>

        {/* === Pickup Guide Section === */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-20 relative z-30">
            <PickupGuide lang={lang} />
        </div>

        {/* === FAQ Section === */}
        <FAQSection lang={lang} />

        {/* === 6. Business Hours and Company Info (Footer) === */}
        <section className="bg-slate-900 text-slate-300 py-16 mt-20 relative z-30 pb-32">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Mail size={20} className="text-blue-400" /> {t('footer.hours_title')}</h3>
                    <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 max-w-sm flex flex-col gap-4">
                        <div className="text-slate-300 font-medium flex items-center gap-3">
                            <span className="bg-slate-700 px-2 py-1.5 rounded text-xs shrink-0">{t('footer.hours_badge')}</span>
                            <span className="text-sm">{t('footer.hours_text')}</span>
                        </div>
                        <div className="flex items-center gap-6 pt-5 mt-2">
                            <a 
                                href="https://www.instagram.com/oceanstar_turtlesnorkelling?igsh=dG8zMDZxczF2Z2t1" 
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
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><MapPin size={20} className="text-blue-400" /> {t('footer.address_title')}</h3>
                    <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 max-w-sm flex flex-col gap-3">
                        <div className="text-slate-300 font-medium flex items-center gap-3">
                            <span className="bg-slate-700 px-2 py-1.5 rounded text-xs shrink-0">{t('footer.email_badge')}</span>
                            <span className="text-sm">hioceanstar@gmail.com</span>
                        </div>
                        <div className="text-slate-300 font-medium flex items-start gap-3">
                            <span className="bg-slate-700 px-2 py-1.5 rounded text-xs shrink-0 mt-0.5">{t('footer.addr_badge')}</span>
                            <div className="flex flex-col gap-1.5 pt-0.5">
                                <span className="text-sm leading-relaxed">1125 Kewalo Basin Harbor, Gate D #110, Honolulu, HI 96814</span>
                                <a 
                                    href="https://www.google.com/maps/place/%EC%98%A4%EC%85%98%EC%8A%A4%ED%83%80/@21.2909527,-157.8596751,17.95z/data=!4m6!3m5!1s0x7c006e0714500001:0x42c44e799ee07eac!8m2!3d21.2913542!4d-157.8586971!16s%2Fg%2F11t2p_627w?authuser=0&entry=ttu&g_ep=EgoyMDI2MDMyMy4xIKXMDSoASAFQAw%3D%3D" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 w-fit transition-colors mt-0.5"
                                >
                                    {t('footer.google_map')} <ChevronRight size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>

             <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
                 <div>
                     <h4 className="text-white font-bold mb-2">{t('footer.company_name')}</h4>
                     <p className="text-slate-500 text-sm whitespace-pre-wrap">{t('footer.company_desc')}</p>
                 </div>
                 <div className="text-slate-500 text-sm md:text-right space-y-1">
                     <p><span className="text-slate-400 font-medium">{t('footer.biz_name')}</span> 알로하 하와이 <span className="mx-2 hidden md:inline">|</span><br className="md:hidden" /> <span className="text-slate-400 font-medium">{t('footer.biz_rep')}</span> 정칠성</p>
                     <p><span className="text-slate-400 font-medium">{t('footer.biz_no')}</span> 765-23-01629</p>
                     <p><span className="text-slate-400 font-medium">{t('footer.biz_addr')}</span> 경기도 안양시 만안구 양화로135번길 29, 3층 일부호(박달동)</p>
                 </div>
             </div>
          </div>
        </section>

      </main>

      {/* 플로팅 예약 버튼 - main 바깥에 위치하여 iOS 스크롤 점프 방지 */}
      {!isBookingOpen && !isReviewOpen && (
        <div className="w-full shrink-0 p-3 sm:p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex justify-center">
          <div className="max-w-[1600px] w-full flex justify-between items-center gap-3 px-2 sm:px-4">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{t('floater.subtitle')}</p>
              <p className="text-sm sm:text-xl font-extrabold text-blue-600 leading-tight line-clamp-2">{t('floater.title')}</p>
            </div>
            <button
              onClick={() => setIsBookingOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 sm:py-3 sm:px-8 rounded-full shadow-lg shadow-blue-500/30 transition-transform active:scale-95 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0"
            >
              {t('floater.btn')} <ChevronRight size={18} />
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
                <h2 className="text-xl font-bold text-slate-900">{t('bookingModal.title')}</h2>
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
                        {t('bookingModal.step1')}
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
                            <h3 className="font-bold text-base mb-1 text-slate-800">
                              {lang === 'en' ? (
                                tour.tour_id === 'morning1' ? '1st Trip Waikiki Turtle Snorkeling' :
                                tour.tour_id === 'morning2' ? '2nd Trip Waikiki Turtle Snorkeling' :
                                tour.tour_id?.toLowerCase().includes('sunset') ? 'Sunset Wine & Waikiki Turtle Snorkeling' :
                                tour.tour_id === 'private' ? '[Private] Waikiki Turtle Snorkeling Trip' :
                                tour.name
                              ) : tour.name}
                            </h3>
                            <p className="text-xs text-slate-500 mb-3">
                              {tour.is_flat_rate ? t('bookingModal.flatRate_sub').replace('{max}', tour.max_capacity) : (tour.tour_id?.toLowerCase().includes('sunset') ? t('tour.details.time_variable') : t('bookingModal.normalRate_sub').replace('{start}', tour.start_time || 'AM').replace('{end}', tour.end_time || ''))}
                            </p>
                            <div className="flex flex-col">
                              <p className="font-extrabold text-blue-700 text-sm">
                                {lang === 'en' ? (
                                  tour.is_flat_rate && tour.tour_id === 'private' ? 'Private Trip (Tiered)' : tour.is_flat_rate ? `$${tour.adult_price_usd?.toLocaleString()} / Team` : `$${tour.adult_price_usd?.toLocaleString()} / Adult`
                                ) : (
                                  tour.is_flat_rate && tour.tour_id === 'private' ? '단독 차터 (계단식 요금)' : tour.is_flat_rate ? `₩${tour.adult_price_krw?.toLocaleString()} / 팀` : `₩${tour.adult_price_krw?.toLocaleString()} / 성인`
                                )}
                              </p>
                              {!tour.is_flat_rate && (tour.child_price_krw || tour.child_price_usd) ? (
                                <p className="font-bold text-blue-500/90 text-xs mt-0.5">
                                  {lang === 'en' 
                                    ? (tour.child_price_usd ? `$${tour.child_price_usd.toLocaleString()} / Child` : '') 
                                    : (tour.child_price_krw ? `₩${tour.child_price_krw.toLocaleString()} / 아동` : '')}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 2. Pax Selection */}
                    {selectedTour && (
                      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black">2</span>
                          {t('bookingModal.step2')}
                        </h2>
                        {isFlatRate && selectedTour === 'private' && (
                            <div className="mb-4 bg-indigo-50 text-indigo-900 p-4 rounded-xl text-sm border border-indigo-100 shadow-sm">
                                <strong className="flex items-center gap-2 mb-1"><Info size={16} className="text-indigo-600" /> {lang === 'en' ? 'Private Trip Pricing' : '프라이빗 차터 요금 안내'}</strong>
                                <p className="text-xs mb-2 opacity-80">{lang === 'en' ? '(Based on total pax, single booking, 2 Hours Tour)' : '(총 인원, 단일 예약 기준, 투어시간 2시간)'}</p>
                                <ul className="space-y-1 ml-6 list-disc opacity-90 font-medium">
                                    <li>1~10{lang === 'en' ? ' pax' : '명'}: $1,200</li>
                                    <li>11~20{lang === 'en' ? ' pax' : '명'}: $1,800</li>
                                    <li>21~30{lang === 'en' ? ' pax' : '명'}: $2,400</li>
                                </ul>
                            </div>
                        )}
                        <div className={`grid ${(isFlatRate) ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                          <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                              {isFlatRate ? <><Users size={16} className="text-blue-500" /> {t('bookingModal.totalPax')}</> : <><Users size={16} className="text-blue-500" /> {t('bookingModal.adultPax')}</>}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={isFlatRate ? selectedTourSetting?.max_capacity : undefined}
                              {...form.register("adultCount", { valueAsNumber: true })}
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-lg bg-slate-50 focus:bg-white"
                            />
                            {isFlatRate && (
                              <p className="text-xs text-slate-500 mt-2">{t('bookingModal.maxPax_notice').replace('{max}', String(selectedTourSetting?.max_capacity || 40))}</p>
                            )}
                          </div>
                          {!(isFlatRate) && (
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">
                                {t('bookingModal.childPax')}
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
                            {t('bookingModal.step3')}
                          </h2>
                          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            {t('bookingModal.avail_pax').replace('{max}', String(maxCapacity))}
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
                          {t('bookingModal.pax_notice').split('{pax}')[0]}<strong className="text-blue-600">{totalSelectedPax}</strong>{t('bookingModal.pax_notice').split('{pax}')[1]}
                        </p>
                      </section>
                    )}



                    {/* 4. Hotel Pick-up & Info */}
                    {selectedTour && selectedDate && (
                      <section ref={infoSectionRef} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black">4</span>
                          {t('bookingModal.step4')}
                        </h2>

                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <MapPin size={16} className="text-blue-500" /> {t('bookingModal.hotel_label')}
                                    </label>
                                    {isLoaded ? (
                                    <Autocomplete
                                        onLoad={onLoad}
                                        onPlaceChanged={onPlaceChanged}
                                    >
                                        <input
                                        type="text"
                                        {...form.register("hotelName")}
                                        placeholder={t('bookingModal.hotel_placeholder')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                                        />
                                    </Autocomplete>
                                    ) : (
                                    <input
                                        type="text"
                                        {...form.register("hotelName")}
                                        placeholder={t('bookingModal.hotel_placeholder')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                                    />
                                    )}
                                    {form.formState.errors.hotelName && <p className="text-red-500 text-xs mt-1 font-bold">{form.formState.errors.hotelName.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('bookingModal.pickup_label')}</label>
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
                                    <option value="" disabled>{t('bookingModal.pickup_placeholder')}</option>
                                    {pickupLocations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                        {getPickupDisplayNameByLang(loc.name, lang)}
                                        {(!isFlatRate || selectedTour !== 'private') && selectedTour === 'morning1' && loc.time_1 ? ` (${formatTimeAMPM(loc.time_1)})` : ''}
                                        {(!isFlatRate || selectedTour !== 'private') && selectedTour === 'morning2' && loc.time_2 ? ` (${formatTimeAMPM(loc.time_2)})` : ''}
                                        {(!isFlatRate || selectedTour !== 'private') && selectedTour === 'sunset' && loc.time_3 ? ` (${formatTimeAMPM(loc.time_3)})` : ''}
                                        </option>
                                    ))}
                                    </select>
                                    {isFlatRate && selectedTour === 'private' && (
                                    <p className="text-sm text-indigo-700 mt-2 font-bold bg-indigo-100/50 p-2.5 rounded-lg flex items-center gap-2">
                                        <Info size={16} /> {t('bookingModal.private_pickup_notice')}
                                    </p>
                                    )}
                                </div>
                            </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">{t('bookingModal.name_label')}</label>
                              <input
                                type="text"
                                placeholder={lang === 'en' ? "e.g., HONG GILDONG" : "예: 홍길동"}
                                {...form.register("bookerName")}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                              />
                              {form.formState.errors.bookerName && <p className="text-red-500 text-xs mt-1 font-bold">{form.formState.errors.bookerName.message}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">{t('bookingModal.email_label')}</label>
                              <input
                                type="email"
                                placeholder="example@email.com"
                                {...form.register("bookerEmail")}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                              />
                              {form.formState.errors.bookerEmail && <p className="text-red-500 text-xs mt-1 font-bold">{form.formState.errors.bookerEmail.message}</p>}
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-slate-700 mb-2">{t('bookingModal.phone_label')}</label>
                              <input
                                type="text"
                                placeholder={lang === 'en' ? "+1 808-000-0000" : "010-0000-0000 혹은 카카오톡 ID"}
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
                                    <span className="text-slate-500 font-bold text-sm">{t('bookingModal.total_payment')} <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded ml-1 text-slate-600">{lang === 'en' ? t('bookingModal.usd_currency') : t('bookingModal.pay_currency')}</span></span>
                                    <span className="text-xs text-slate-400 mt-1 font-medium bg-slate-100 px-2 py-1 rounded w-fit">
                                      {(isFlatRate && selectedTour === 'private') 
                                        ? (lang === 'en' ? `Private Trip (Total ${totalSelectedPax})` : `프라이빗 차터 (총 ${totalSelectedPax}명)`) 
                                        : (lang === 'en' ? `Adult ${adultCount} / Child ${childCount}` : `성인 ${adultCount}명 / 아동 ${childCount}명`)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-blue-600 tracking-tight">{lang === 'en' ? '$' : '₩'}{totalPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-black text-lg py-4 rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 shadow-xl shadow-blue-600/30"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <CreditCard size={24} />}
                                {isSubmitting ? t('bookingModal.waiting') : t('bookingModal.checkout_btn')}
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
                    <MessageSquare className="text-blue-500" /> {t('reviewModal.title')}
                </h2>
                <button onClick={() => setIsReviewOpen(false)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={onReviewSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{lang === 'en' ? 'Booking ID (6 alphanumeric characters)' : '예약 번호 (영숫자 6자리)'}</label>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder={lang === 'en' ? "e.g.: A4X9T2" : "예: A4X9T2"}
                            value={reviewForm.order_id}
                            onChange={(e) => setReviewForm({ ...reviewForm, order_id: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase tracking-widest font-mono font-bold"
                        />
                        <p className="text-xs text-slate-500 mt-1">{lang === 'en' ? 'You can find it on your booking confirmation voucher.' : '예약 확정 및 결제 후 전송된 바우처에서 확인하실 수 있습니다.'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('reviewModal.name_label')}</label>
                        <input
                            type="text"
                            required
                            placeholder={t('reviewModal.name_placeholder')}
                            value={reviewForm.author_name}
                            onChange={(e) => setReviewForm({ ...reviewForm, author_name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('reviewModal.rating_label')}</label>
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
                            <span className="ml-2 font-bold text-slate-700">{reviewForm.rating}{lang === 'en' ? ' pts' : '점'}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('reviewModal.content_label')}</label>
                        <textarea
                            required
                            rows={4}
                            placeholder={t('reviewModal.content_placeholder')}
                            value={reviewForm.content}
                            onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none font-medium"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('reviewModal.photo_label')} (Max 5)</label>
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
                                    <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                                        <img src={previewUrls[idx] || ''} alt="preview" className="w-full h-full object-contain" />
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
                            {isSubmittingReview ? (lang === 'en' ? "Submitting..." : "등록 중...") : t('reviewModal.submitBtn')}
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
                         {expandedTourDetails.tour_id === 'private' ? t('tour.names.private') : expandedTourDetails.name}
                     </h3>
                     <button onClick={() => setExpandedTourDetails(null)} className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors shadow-sm border border-slate-200">
                         <X size={20} />
                     </button>
                 </div>
                 {/* Modal Body / Scrollable */}
                 <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-50">
                     {expandedTourDetails.tour_id === 'private' || expandedTourDetails.is_combined || expandedTourDetails.tour_id?.toLowerCase().includes('morning') || expandedTourDetails.tour_id?.toLowerCase().includes('sunset') || (typeof expandedTourDetails.name === 'string' && expandedTourDetails.name.includes('선셋')) ? (
                         <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 sm:p-6">
                             <TourCourseTimeline isSunset={(typeof expandedTourDetails.name === 'string' && expandedTourDetails.name.includes('선셋')) || expandedTourDetails.tour_id?.toLowerCase().includes('sunset')} lang={lang} />
                         </div>
                     ) : (
                         <div className="min-h-[40vh] sm:min-h-[50vh] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-white p-6">
                             <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                 <ClipboardList size={32} opacity={0.5} />
                             </div>
                             <p className="font-bold text-slate-700 text-lg sm:text-xl mb-2 text-center">{lang === 'en' ? 'Detailed information is not yet available.' : '상세 정보가 아직 입력되지 않았습니다.'}</p>
                             <p className="text-slate-500 text-sm text-center max-w-md leading-relaxed px-4">
                                 {lang === 'en' ? 'More information like schedule, diagrams, and photos will be added here soon!' : '관리자님, 나중에 이곳에 투어 스케줄, 코스 다이어그램, 준비물, 주의사항, 수많은 사진들을 마음껏 올릴 수 있습니다. (상하 스크롤이 자유로운 넓은 영역입니다!)'}
                             </p>
                         </div>
                     )}
                 </div>
                 {/* Modal Footer */}
                 <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-3">
                     <button onClick={() => setExpandedTourDetails(null)} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors w-full sm:w-auto text-center">
                         {lang === 'en' ? 'Close' : '닫기'}
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
                         {t('tour.bookBtn')}
                     </button>
                 </div>
             </div>
          </div>
        )}

        {/* Fullscreen Image Lightbox Modal */}
        {lightboxImage && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 sm:p-8 animate-in fade-in duration-200" onClick={() => setLightboxImage(null)}>
            <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
              <button 
                onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }} 
                className="absolute top-0 right-0 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors m-2 sm:m-4 shadow-lg border border-white/20"
                title="Close"
              >
                <X size={28} />
              </button>
              <img 
                src={lightboxImage} 
                alt="Enlarged review photo" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                onClick={(e) => e.stopPropagation()} 
              />
            </div>
          </div>
        )}

        {/* 결제 통화 선택 모달 */}
        <CurrencySelectModal
          isOpen={isCurrencyModalOpen}
          onClose={() => setIsCurrencyModalOpen(false)}
          onSelectKRW={() => processPayment('KRW')}
          onSelectUSD={() => processPayment('USD')}
          lang={lang}
        />

    </div>
  );
}
