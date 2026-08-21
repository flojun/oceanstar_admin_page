"use client";

import Link from "next/link";
import Script from "next/script";
import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, MapPin, Calendar, Users, CreditCard, Loader2, ChevronRight, ChevronLeft, Info, X, ShieldCheck, Star, Anchor, UsersRound, Award, MessageSquare, User, ClipboardList, AlertTriangle, Mail, Instagram, Youtube, Sparkles, Menu, Utensils } from "lucide-react";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { calculateDistance, findClosestPickup, PickupLocation, getWalkingMinutes, maskName } from '@/lib/utils';
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse } from "date-fns";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { TourSetting, getTourNameByLang } from "@/lib/tourUtils";
import FAQSection from "@/components/landing/FAQSection";
import PickupGuide from "@/components/landing/PickupGuide";
import TourCourseTimeline from "@/components/landing/TourCourseTimeline";
import { getPickupDisplayNameByLang } from '@/constants/pickupLocations';
import ImageCarousel from "@/components/landing/ImageCarousel";
import { getTranslation, setLanguageCookie, type Language } from "@/lib/translations";
import CurrencySelectModal from "@/components/payment/CurrencySelectModal";
import GoogleReviews from "@/components/GoogleReviews";
import Reveal from "@/components/landing/Reveal";

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

const formSchema = z.object({
  tourDate: z.date(),
  adultCount: z.number().min(1, "최소 1명 이상 선택해주세요"),
  childCount: z.number().min(0),
  hotelName: z.string().optional(),
  bookerName: z.string().min(1, "예약자 성함을 입력해주세요"),
  bookerEmail: z.string().email("정확한 이메일을 입력해주세요"),
  bookerPhone: z.string().min(10, "연락처를 입력해주세요"),
  comboOption: z.string().optional(), // '1', '2', '3'
  secondaryDate: z.date().optional(),
  secondaryPickupLocationName: z.string().optional(),
  comboTimeOption: z.string().optional(),
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
  const paxSectionRef = useRef<HTMLElement>(null);

  const [comboOption, setComboOption] = useState<string | null>(null);
  const [comboTimeOption, setComboTimeOption] = useState<string | null>(null);
  const [secondaryDate, setSecondaryDate] = useState<Date | undefined>();
  const [secondaryClosestPickup, setSecondaryClosestPickup] = useState<{ location: PickupLocation, minutes: number } | null>(null);
  const secondaryAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [secondaryCurrentMonth, setSecondaryCurrentMonth] = useState<Date>(new Date());


  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availabilities, setAvailabilities] = useState<Record<string, { booked: number, remaining: number, isAvailable: boolean }>>({});
  const [maxCapacity, setMaxCapacity] = useState(45);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [tourSettings, setTourSettings] = useState<TourSetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ date: string; tour_id: string; reason: string | null }[]>([]);
  const [imageVersions, setImageVersions] = useState<Record<string, any>>({});
  const PUBLIC_URL_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-assets`;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ==== 리뷰 상태 ====
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
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
        if (Array.isArray(data)) {
          const sorted = data.sort((a: any, b: any) => {
            if (a.name === '직접') return 1;
            if (b.name === '직접') return -1;
            return (a.time_1 || '').localeCompare(b.time_1 || '');
          });
          setPickupLocations(sorted);
        }
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

    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-assets/versions.json?t=${Date.now()}`, { cache: "no-store" })
      .then(res => res.json())
      .then(data => setImageVersions(data))
      .catch(() => {});

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
      } else if (place.name) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: place.name }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const resultLat = results[0].geometry.location.lat();
            const resultLng = results[0].geometry.location.lng();
            form.setValue("hotelName", place.name || results[0].formatted_address);
            const pickupResult = findClosestPickup(resultLat, resultLng, pickupLocations);
            if (pickupResult) {
              setClosestPickup({
                location: pickupResult.closestLocation,
                minutes: getWalkingMinutes(pickupResult.distanceMeters)
              });
            }
          }
        });
      }
    }
  };

  const onSecondaryLoad = (autocomplete: google.maps.places.Autocomplete) => {
    secondaryAutocompleteRef.current = autocomplete;
  };

  const onSecondaryPlaceChanged = () => {
    if (secondaryAutocompleteRef.current !== null) {
      const place = secondaryAutocompleteRef.current.getPlace();
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (lat && lng) {
        form.setValue("secondaryPickupLocationName", place.name || "");
        const result = findClosestPickup(lat, lng, pickupLocations);
        if (result) {
          setSecondaryClosestPickup({
            location: result.closestLocation,
            minutes: getWalkingMinutes(result.distanceMeters)
          });
        }
      } else if (place.name) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: place.name }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const resultLat = results[0].geometry.location.lat();
            const resultLng = results[0].geometry.location.lng();
            form.setValue("secondaryPickupLocationName", place.name || results[0].formatted_address);
            const pickupResult = findClosestPickup(resultLat, resultLng, pickupLocations);
            if (pickupResult) {
              setSecondaryClosestPickup({
                location: pickupResult.closestLocation,
                minutes: getWalkingMinutes(pickupResult.distanceMeters)
              });
            }
          }
        });
      }
    }
  };

  const handleHotelBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const address = e.target.value;
    if (address && window.google) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const resultLat = results[0].geometry.location.lat();
          const resultLng = results[0].geometry.location.lng();
          form.setValue("hotelName", address);
          const pickupResult = findClosestPickup(resultLat, resultLng, pickupLocations);
          if (pickupResult) {
            setClosestPickup({
              location: pickupResult.closestLocation,
              minutes: getWalkingMinutes(pickupResult.distanceMeters)
            });
          }
        }
      });
    }
  };

  const handleSecondaryHotelBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const address = e.target.value;
    if (address && window.google) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const resultLat = results[0].geometry.location.lat();
          const resultLng = results[0].geometry.location.lng();
          form.setValue("secondaryPickupLocationName", address);
          const pickupResult = findClosestPickup(resultLat, resultLng, pickupLocations);
          if (pickupResult) {
            setSecondaryClosestPickup({
              location: pickupResult.closestLocation,
              minutes: getWalkingMinutes(pickupResult.distanceMeters)
            });
          }
        }
      });
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
  if (selectedTour === 'combo_marine') {
     const comboPrice = comboOption === '3' ? 310 : 210;
     const exchangeRate = selectedTourSetting?.adult_price_usd ? ((selectedTourSetting.adult_price_krw || 0) / selectedTourSetting.adult_price_usd) : 1350;
     if (lang === 'en') {
       totalPrice = (adultCount * comboPrice) + (childCount * comboPrice);
     } else {
       totalPrice = (adultCount * (comboPrice * exchangeRate)) + (childCount * (comboPrice * exchangeRate));
     }
  } else if (isFlatRate && selectedTour === 'private') {
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

    if (selectedTour === 'combo_marine') {
      if (!comboOption) {
        alert(lang === 'en' ? 'Please select a combo option.' : '패러세일링/제트스키 옵션을 선택해주세요.');
        return;
      }
      if (!comboTimeOption) {
        alert(lang === 'en' ? 'Please select a snorkeling time.' : '거북이 스노클링 시간을 선택해주세요.');
        return;
      }
      if (!values.secondaryDate) {
         alert(lang === 'en' ? 'Please select a date for the second activity.' : '패러세일링/제트스키 날짜를 선택해주세요.');
         return;
      }
      if (!secondaryClosestPickup?.location?.id && (!values.secondaryPickupLocationName || values.secondaryPickupLocationName.trim() === '')) {
         alert(lang === 'en' ? 'Please enter pickup location for the second activity.' : '패러세일링/제트스키 픽업 장소를 입력해주세요.');
         return;
      }
    }

    if (!closestPickup?.location?.id && (!values.hotelName || values.hotelName.trim() === '')) {
      form.setError('hotelName', { 
        type: 'manual', 
        message: lang === 'en' ? 'Please enter your hotel or select a pickup location' : '숙소를 입력하거나 픽업 장소를 선택해주세요' 
      });
      form.setFocus('hotelName');
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
          secondaryPickupLocationId: secondaryClosestPickup?.location?.id,
          secondaryPickupLocationName: secondaryClosestPickup?.location.name || undefined,
          comboTimeOption: comboTimeOption,
          ...pendingBookingData,
          tourDate: formattedDate,
          secondaryDate: pendingBookingData.secondaryDate ? format(pendingBookingData.secondaryDate, "yyyy-MM-dd") : null,
          comboOption,
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
    <div className="fixed inset-0 flex flex-col text-slate-800 font-sans selection:bg-sky-200 selection:text-sky-900">
      {/* Global Background Image */}
      <div className="absolute inset-0 -z-50 bg-sky-50">
        <Image src="/images/turtle_bg_lineart.png" alt="Background" fill className="object-cover object-center opacity-50" unoptimized={true} />
        <div className="absolute inset-0 bg-white/40 z-10 pointer-events-none"></div>
      </div>
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
      <header className="w-full z-40 shrink-0 pt-4 px-4 sm:px-8 mb-[-80px] sm:mb-[-100px] pointer-events-none relative">
        <div className={`pointer-events-auto max-w-[1300px] mx-auto px-6 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between relative transition-all duration-500 rounded-[2.5rem] ${isScrolled ? 'bg-white/30 backdrop-blur-[40px] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] border border-white/50' : 'bg-white/10 backdrop-blur-md border border-white/20 shadow-lg'}`}>
          <div className="flex items-center shrink-0 cursor-pointer" onClick={() => scrollToSection('home')}>
            <img src="/logo.png" alt="OceanStar Logo" className="h-10 sm:h-12 w-auto object-contain" />
          </div>

          <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-4 xl:gap-8 font-bold text-[15px] text-slate-700">
            <button onClick={() => scrollToSection('home')} className="hover:text-blue-600 transition">Home</button>
            <button onClick={() => scrollToSection('tours')} className="hover:text-blue-600 transition">{lang === 'en' ? 'Tours' : '투어'}</button>
            <button onClick={() => scrollToSection('reviews')} className="hover:text-blue-600 transition">{lang === 'en' ? 'Reviews' : '고객후기'}</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-blue-600 transition">FAQ</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-blue-600 transition">{lang === 'en' ? 'About Us' : '회사소개'}</button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
             <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-lg transition-all"
                aria-label="Toggle Menu"
             >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
             </button>
             <button
                onClick={() => {
                   const targetLang = lang === 'ko' ? 'en' : 'ko';
                   setLanguageCookie(targetLang);
                   window.location.href = targetLang === 'en' ? '/' : '/kr';
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
                href={lang === 'en' ? '/manage-booking' : '/kr/manage-booking'}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold text-[11.5px] sm:text-sm shadow-sm transition-all whitespace-nowrap shrink-0">
                {t('header.manageBooking')}
             </Link>
             <button
                onClick={() => setIsBookingOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md shadow-blue-500/30 transition-all sm:block hidden whitespace-nowrap">
                {t('header.bookNow')}
             </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-[100%] left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xl py-4 px-6 flex flex-col gap-2 font-bold text-[15px] text-slate-800 animate-in slide-in-from-top-2">
            <button onClick={() => { scrollToSection('home'); setIsMobileMenuOpen(false); }} className="text-left py-3 border-b border-slate-100 hover:text-blue-600 transition">Home</button>
            <button onClick={() => { scrollToSection('tours'); setIsMobileMenuOpen(false); }} className="text-left py-3 border-b border-slate-100 hover:text-blue-600 transition">{lang === 'en' ? 'Tours' : '투어'}</button>
            <button onClick={() => { scrollToSection('reviews'); setIsMobileMenuOpen(false); }} className="text-left py-3 border-b border-slate-100 hover:text-blue-600 transition">{lang === 'en' ? 'Reviews' : '고객후기'}</button>
            <button onClick={() => { scrollToSection('faq'); setIsMobileMenuOpen(false); }} className="text-left py-3 border-b border-slate-100 hover:text-blue-600 transition">FAQ</button>
            <button onClick={() => { scrollToSection('about'); setIsMobileMenuOpen(false); }} className="text-left py-3 hover:text-blue-600 transition">{lang === 'en' ? 'About Us' : '회사소개'}</button>
          </div>
        )}
      </header>

      <main ref={mainRef} className="w-full flex-1 overflow-y-auto pb-0 bg-transparent">
        {/* === 1. Hero Section === */}
        <section id="home" className="relative w-full min-h-[100svh] sm:min-h-[85vh] lg:min-h-[800px] flex items-center justify-center overflow-hidden">
          {/* Background Overlay Removed for Seamless Global Background */}
          
          {/* Content Wrapper */}
          <div className="relative z-20 w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center pt-20">

             <Reveal className="bg-gradient-to-b from-white/40 to-white/10 backdrop-blur-[40px] border border-white/60 p-8 sm:p-20 rounded-[3rem] shadow-[inset_0_0_40px_rgba(255,255,255,0.8),0_15px_35px_rgba(0,0,0,0.08)] flex flex-col items-center">
                 <h1 className="text-center drop-shadow-sm mb-6">
                    {lang === 'ko' ? (
                      <>
                        <span className="block font-semibold text-slate-700 text-[1.4rem] sm:text-3xl md:text-4xl mb-2 sm:mb-4 tracking-tight">{t('hero.title1')}</span>
                        <span className="block font-black text-sky-600 text-[2.8rem] sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
                            지금,<br className="sm:hidden" />
                            <span className="hidden sm:inline"> </span>
                            오션스타에서
                        </span>
                      </>
                    ) : (
                      <span className={`font-black text-sky-600 leading-tight drop-shadow-sm text-3xl break-words sm:text-4xl md:text-5xl lg:text-6xl`}>
                        {t('hero.title1')}{t('hero.title1') ? <br/> : null}{t('hero.title2')}{t('hero.title3')}
                      </span>
                    )}
                 </h1>

                 <p className={`text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 font-medium mb-12 text-center leading-relaxed max-w-[95%] sm:max-w-2xl ${lang === 'en' ? 'break-words' : 'break-keep'}`}>
                    {t('hero.desc1')}
                 </p>

                 <button
                    onClick={() => setIsBookingOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white shadow-[0_15px_35px_rgba(37,99,235,0.35)] transition-all px-12 py-4 sm:px-16 sm:py-5 rounded-full font-black tracking-tight text-[16px] sm:text-xl mb-2"
                    style={{ fontFamily: "'Inter', 'Pretendard', -apple-system, sans-serif" }}>
                    {t('hero.mainBtn')}
                 </button>
             </Reveal>
          </div>
        </section>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 relative z-30">
        
          {/* === 2. Bento Box Introduction === */}
          <section className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 sm:gap-6 mb-16 sm:mb-24">
            <Reveal delay={0} className="md:col-span-3 lg:col-span-4 bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-[40px] rounded-[2rem] p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_15px_35px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col justify-start transform hover:-translate-y-2 hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.9),0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 group">
              <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <Award className="w-8 h-8 text-sky-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-800 mb-3 break-keep">{t('bento.desc1_title')}</h3>
              <p className="text-slate-600 font-medium text-base leading-relaxed break-keep">{t('bento.desc1_text')}</p>
            </Reveal>

            <Reveal delay={0.08} className="md:col-span-3 lg:col-span-4 bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-[40px] rounded-[2rem] p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_15px_35px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col justify-start transform hover:-translate-y-2 hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.9),0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 group">
              <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/80 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <Star className="w-8 h-8 text-sky-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-800 mb-3 break-keep">{t('bento.desc2_title')}</h3>
              <p className="text-slate-600 font-medium text-base leading-relaxed break-keep">{t('bento.desc2_text')}</p>
            </Reveal>

            <Reveal delay={0.16} className="md:col-span-6 lg:col-span-4 bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-[40px] rounded-[2rem] p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_15px_35px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col justify-start transform hover:-translate-y-2 hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.9),0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 group">
              <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <ShieldCheck className="w-8 h-8 text-sky-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-800 mb-3 break-keep">{t('bento.desc3_title')}</h3>
              <p className="text-slate-600 font-medium text-base leading-relaxed break-keep">{t('bento.desc3_text')}</p>
            </Reveal>

            <Reveal delay={0} className="md:col-span-3 lg:col-span-6 bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-[40px] rounded-[2rem] p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_15px_35px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col justify-start transform hover:-translate-y-2 hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.9),0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 group">
              <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/80 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <Anchor className="w-8 h-8 text-sky-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-800 mb-3 break-keep">{t('bento.desc4_title')}</h3>
              <p className="text-slate-600 font-medium text-base leading-relaxed break-keep">{t('bento.desc4_text')}</p>
            </Reveal>

            <Reveal delay={0.08} className="md:col-span-3 lg:col-span-6 bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-[40px] rounded-[2rem] p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_15px_35px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col justify-start transform hover:-translate-y-2 hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.9),0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 group">
              <div className="w-16 h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <UsersRound className="w-8 h-8 text-sky-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-slate-800 mb-3 break-keep">{t('bento.desc5_title')}</h3>
              <p className="text-slate-600 font-medium text-base leading-relaxed break-keep">{t('bento.desc5_text')}</p>
            </Reveal>
          </section>

          {/* === 3. Tour Packages (Cards) === */}
          <section id="tours" className="mb-10">
            <Reveal className="text-center mb-12">
               <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('tour.title')}</h2>
               <p className="text-lg text-slate-500">{t('tour.subtitle')}</p>
            </Reveal>

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
                    if (tItem.tour_id === 'private') return { 
                        ...tItem, 
                        name: <span className="block text-center leading-snug whitespace-pre-wrap">{lang === 'ko' ? "[단독 대관]\n프라이빗 VIP 와이키키 거북이 스노클링" : t('tour.names.private').replace('] ', ']\n')}</span>,
                        description: lang === 'ko' ? "배를 통째로 대여하여 프라이빗 하게 즐기는 스노클링 투어, 우리끼리 즐기는 여유로운 시간과 특별한 추억." : tItem.description
                    };
                    if (tItem.tour_id === 'combo_marine') return {
                        ...tItem,
                        name: <span className="block text-center leading-snug whitespace-pre-wrap">{lang === 'en' ? "Turtle Snorkeling +\nParasailing / Jet Ski" : tItem.name.replace(' + ', ' +\n')}</span>
                    };
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
                    if (isPrivate) theme = { bg: 'bg-slate-900', gradient: 'from-slate-800 to-indigo-900', text: 'text-white', badge: '', btn: '', specialLabel: <span className="flex items-center gap-1"><Sparkles size={14} className="text-yellow-300 fill-yellow-300" /> {lang === 'en' ? 'Opening Special' : '오픈특가'} <Sparkles size={14} className="text-yellow-300 fill-yellow-300" /></span>, specialLabelBg: 'bg-gradient-to-r from-fuchsia-600 to-purple-600', isDark: true };
                    else if (isSunset) theme = { bg: 'bg-orange-100', gradient: 'from-orange-400 to-rose-400', text: 'text-orange-900', badge: '', btn: '', specialLabel: lang === 'ko' ? '커플/ 신혼 추천!' : t('tour.badges.couple'), specialLabelBg: 'bg-gradient-to-r from-orange-400 to-red-500', isDark: false };
                    else theme = { ...theme, badge: '', btn: '', specialLabel: lang === 'ko' ? '베스트 셀러' : 'Best Seller', specialLabelBg: 'bg-blue-600 text-white' };

                      const tourImages = (() => {
                        // Use Supabase image if it exists in versions.json (multi image list)
                        const listKey = `option_${tour.tour_id}_list`;
                        if (tour.tour_id && Array.isArray(imageVersions[listKey]) && imageVersions[listKey].length > 0) {
                          return imageVersions[listKey].map((img: any) => ({
                              src: `${PUBLIC_URL_BASE}/${listKey.replace('_list', '')}_${img.id}.jpg?v=${img.version}`
                          }));
                        }
                        
                        // Combined morning virtual ID handling
                        if (tour.tour_id === 'combined_morning') {
                           if (Array.isArray(imageVersions[`option_morning1_list`]) && imageVersions[`option_morning1_list`].length > 0) {
                              return imageVersions[`option_morning1_list`].map((img: any) => ({
                                  src: `${PUBLIC_URL_BASE}/option_morning1_${img.id}.jpg?v=${img.version}`
                              }));
                           }
                        }

                        // Fallback to static local images if lists are completely empty or not found
                        if (isSunset) {
                          return [
                            { src: '/images_option_card/sunset.jpg' },
                            { src: '/images_option_card/kayak_sunset.jpg', style: { transform: 'rotate(1.64deg) scale(1.1)' } },
                            { src: '/images_option_card/sunset_people.png', style: { objectPosition: 'right center', transform: 'rotate(0.91deg) scale(1.08)' } },
                            { src: '/images_option_card/sunset_cheeseboard.jpg' }
                          ];
                        } else {
                          return [
                            { src: '/images_option_card/snorkeling_turtle.jpg', style: { transform: 'rotate(-6deg) scale(1.3)' } },
                            { src: '/images_option_card/paddleboad_people.jpg', style: { objectPosition: 'center 80%', transform: 'rotate(-1.12deg) scale(1.1)' } }
                          ];
                        }
                      })();

                    return (
                      <Reveal key={tour.tour_id} delay={(idx % 3) * 0.08} className={`${isPrivate ? 'lg:col-span-3 lg:flex-row' : ''} ${theme.isDark ? 'bg-[#0a1740] backdrop-blur-[40px] text-white border border-white/40 shadow-[inset_0_0_30px_rgba(255,255,255,0.2),0_15px_35px_rgba(0,0,0,0.2)]' : 'bg-gradient-to-br from-white/50 to-white/20 backdrop-blur-[40px] border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_15px_35px_rgba(0,0,0,0.05)]'} flex-col rounded-[2.5rem] overflow-hidden hover:-translate-y-2 hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.9),0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 flex group relative`}>
                        {theme.specialLabel && (
                          <div className={`absolute top-0 right-10 ${theme.specialLabelBg || 'bg-gradient-to-r from-orange-400 to-red-500'} text-white text-xs font-bold px-4 py-1.5 rounded-b-xl z-10 shadow-md`}>
                            {theme.specialLabel}
                          </div>
                        )}
                        <div className={`${isPrivate ? 'h-56 lg:h-auto lg:w-[45%]' : 'h-56'} relative overflow-hidden shrink-0`}>
                          <ImageCarousel images={tourImages} interval={4000} />
                          <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${theme.isDark ? 'from-[#0a1740]/80' : 'from-white/40'} to-transparent z-10 pointer-events-none`}></div>
                        </div>
                        <div className={`p-6 sm:p-8 flex-1 flex flex-col justify-center relative z-20`}>
                          <h3 className={`text-2xl font-bold text-center ${theme.isDark ? 'text-white drop-shadow-md' : 'text-slate-800 drop-shadow-sm'} mb-3`}>{tour.name}</h3>
                          <p className={`${theme.isDark ? 'text-slate-300' : 'text-slate-600'} mb-6 text-sm leading-relaxed flex-1`}>
                            {lang === 'en' ? (tour.description_en || "Enjoy the best snorkeling tour in Waikiki with OceanStar. Guaranteed safe and fun time with professional guides.") : (tour.description || "와이키키 최고의 투어를 오션스타와 함께하세요. 전문가의 안내로 안전하고 즐거운 시간을 보장합니다.")}
                          </p>
                          <div className={`${theme.isDark ? 'bg-white/10 border-white/30 backdrop-blur-md shadow-[inset_0_0_15px_rgba(255,255,255,0.1)]' : 'bg-white/40 border-white/60 backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,255,255,0.5)]'} p-4 rounded-2xl mb-6 border`}>
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
                              <p className={`text-xl sm:text-2xl font-black truncate pr-2 text-blue-600`}>
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
                                <button onClick={() => { if(tour.tour_id !== 'combined_morning' && tour.tour_id) { setSelectedTour(tour.tour_id); } else { setSelectedTour(null); } if(tour.is_flat_rate) form.setValue("childCount", 0); setIsBookingOpen(true); }} className={`flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 whitespace-nowrap ${isPrivate ? 'bg-white hover:bg-slate-100 text-blue-950 shadow-[0_4px_14px_0_rgba(255,255,255,0.25)]' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.35)]'}`}>{t('tour.bookBtn')}</button>
                            </div>
                          </div>
                        </div>
                      </Reveal>
                    );
                  });
               })()}
            </div>
          </section>
        </div>

        {/* === 4. Customer Reviews Section === */}
        <section id="reviews" className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-20 relative z-30">
            <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                   <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{t('review.title')}</h2>
                   <p className="text-lg text-slate-500">{t('review.subtitle')}</p>
                </div>
                <button
                   onClick={() => setIsReviewOpen(true)}
                   className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto px-8 py-4 md:py-3 rounded-2xl font-black text-base md:text-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                   <MessageSquare size={20} />
                   {t('review.writeBtn')}
                </button>
            </Reveal>

            {isLoadingReviews ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
            ) : reviews.length === 0 ? (
                <div className="bg-white/20 backdrop-blur-[40px] shadow-inner rounded-[2rem] border border-white/50 p-12 text-center text-slate-500 font-medium">
                    {t('review.empty')}
                </div>
            ) : (
                <Reveal className="relative group">
                    <button 
                        onClick={() => scrollReviews('left')} 
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 sm:-ml-6 z-10 bg-white/80 backdrop-blur-md shadow-lg border border-white/50 text-slate-800 w-12 h-12 rounded-full hover:bg-white hover:scale-105 transition-all hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-0"
                        aria-label="이전 리뷰"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button 
                        onClick={() => scrollReviews('right')} 
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 sm:-mr-6 z-10 bg-white/80 backdrop-blur-md shadow-lg border border-white/50 text-slate-800 w-12 h-12 rounded-full hover:bg-white hover:scale-105 transition-all hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-0"
                        aria-label="다음 리뷰"
                    >
                        <ChevronRight size={24} />
                    </button>
                    <div 
                        ref={reviewScrollRef}
                        className="flex items-stretch overflow-x-auto snap-x snap-mandatory gap-6 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scroll" 
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <style dangerouslySetInnerHTML={{__html: `
                            .hide-scroll::-webkit-scrollbar { display: none; }
                        `}} />
                        {reviews.map((review) => (
                        <div key={review.id} className="bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-[40px] rounded-[2rem] p-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.6),0_10px_20px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col shrink-0 w-[85vw] sm:w-[320px] lg:w-[350px] snap-center transform hover:-translate-y-2 transition-all duration-500 hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.8),0_20px_40px_rgba(0,0,0,0.1)]">
                            <div className="flex items-center gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} />
                                ))}
                            </div>
                            <div className="flex-1 flex flex-col mb-4">
                                <p className={`text-slate-700 italic whitespace-pre-wrap leading-relaxed text-sm font-medium ${!expandedReviews[review.id] ? 'line-clamp-4' : ''}`}>
                                    "{lang === 'en' && review.content_en ? review.content_en : review.content}"
                                </p>
                                {((lang === 'en' && review.content_en ? review.content_en : review.content)?.length || 0) > 120 && (
                                    <button 
                                        onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                                        className="text-blue-500 hover:text-blue-600 text-[13px] font-bold self-start mt-2 flex items-center gap-1 transition-colors"
                                    >
                                        {expandedReviews[review.id] ? (lang === 'en' ? 'Show less' : '접기') : (lang === 'en' ? 'Read more' : '더보기')}
                                    </button>
                                )}
                            </div>
                            {review.image_urls && review.image_urls.length > 0 && (
                                <div className={`grid gap-2 mb-4 ${review.image_urls.length === 1 ? 'grid-cols-1' : review.image_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                    {review.image_urls.slice(0, 5).map((url: string, index: number) => (
                                        <div key={index} className={`relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100/50 border border-white/50 shadow-sm flex items-center justify-center group`}>
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
                            <div className="border-t border-white/50 pt-4 flex items-center gap-3 mt-auto">
                                <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-600 font-bold">
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
                </Reveal>
            )}

            {/* Google Reviews Carousel */}
            <Reveal className="mt-12">
                <GoogleReviews />
            </Reveal>

            {/* YouTube Video Section */}
            <Reveal className="mt-12">
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
            </Reveal>
        </section>

        {/* === Pickup Guide Section === */}
        <Reveal className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-20 relative z-30">
            <PickupGuide lang={lang} />
        </Reveal>

        {/* === FAQ Section === */}
        <Reveal id="faq">
           <FAQSection lang={lang} />
        </Reveal>

        {/* === 6. Business Hours and Company Info (Footer) === */}
        <section id="about" className="bg-gradient-to-t from-sky-900/40 to-transparent backdrop-blur-[40px] text-slate-800 py-16 mt-20 relative z-30 pb-32 border-t border-white/60 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <Reveal className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Mail size={20} className="text-sky-600 drop-shadow-sm" /> {t('footer.hours_title')}</h3>
                    <div className="bg-white/40 p-5 rounded-2xl border border-white/60 max-w-sm flex flex-col gap-4 shadow-inner backdrop-blur-md hover:bg-white/50 transition-colors">
                        <div className="text-slate-700 font-medium flex items-center gap-3">
                            <span className="bg-white/60 border border-white/80 shadow-sm px-2 py-1.5 rounded text-xs shrink-0">{t('footer.hours_badge')}</span>
                            <span className="text-sm font-semibold">{t('footer.hours_text')}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-5 mt-2">
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
                            <Link 
                                href={lang === 'en' ? '/restaurants' : '/kr/restaurants'}
                                className="transform transition-all duration-300 hover:-translate-y-2 hover:scale-105 drop-shadow-sm hover:drop-shadow-xl bg-teal-600 hover:bg-teal-700 text-white font-black px-4 py-3 rounded-2xl flex items-center gap-2 shadow-md hover:shadow-lg border border-white/40"
                            >
                                <Utensils size={24} />
                                <span className="text-sm sm:text-base leading-tight text-center">{lang === 'en' ? 'Hawaiian Restaurants' : '맛집 리스트 보기'}</span>
                            </Link>
                        </div>
                    </div>
                 </div>
                 
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><MapPin size={20} className="text-sky-600 drop-shadow-sm" /> {t('footer.address_title')}</h3>
                    <div className="bg-white/40 p-5 rounded-2xl border border-white/60 max-w-sm flex flex-col gap-3 shadow-inner backdrop-blur-md hover:bg-white/50 transition-colors">
                        <div className="text-slate-700 font-medium flex items-center gap-3">
                            <span className="bg-white/60 border border-white/80 shadow-sm px-2 py-1.5 rounded text-xs shrink-0">{t('footer.email_badge')}</span>
                            <span className="text-sm font-semibold">hioceanstar@gmail.com</span>
                        </div>
                        <div className="text-slate-700 font-medium flex items-start gap-3">
                            <span className="bg-white/60 border border-white/80 shadow-sm px-2 py-1.5 rounded text-xs shrink-0 mt-0.5">{t('footer.addr_badge')}</span>
                            <div className="flex flex-col gap-1.5 pt-0.5">
                                <span className="text-sm leading-relaxed font-semibold">1125 Kewalo Basin Harbor, Gate D #110, Honolulu, HI 96814</span>
                                <a 
                                    href="https://www.google.com/maps/place/%EC%98%A4%EC%85%98%EC%8A%A4%ED%83%80/@21.2909527,-157.8596751,17.95z/data=!4m6!3m5!1s0x7c006e0714500001:0x42c44e799ee07eac!8m2!3d21.2913542!4d-157.8586971!16s%2Fg%2F11t2p_627w?authuser=0&entry=ttu&g_ep=EgoyMDI2MDMyMy4xIKXMDSoASAFQAw%3D%3D" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs text-sky-700 hover:text-sky-800 underline underline-offset-2 flex items-center gap-1 w-fit transition-colors mt-0.5"
                                >
                                    {t('footer.google_map')} <ChevronRight size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>

             <div className="border-t border-white/40 mt-12 pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
                 <div>
                     <h4 className="text-slate-800 font-black mb-2">{t('footer.company_name')}</h4>
                     <p className="text-slate-600 text-sm whitespace-pre-wrap font-medium">{t('footer.company_desc')}</p>
                 </div>
                 <div className="text-slate-600 text-sm md:text-right space-y-1 font-medium">
                     <p><span className="text-slate-500 font-bold">{t('footer.biz_name')}</span> Oceanview Activity LLC</p>
                     <p><span className="text-slate-500 font-bold">{t('footer.biz_addr')}</span> 615 PIKOI ST. STE 811</p>
                     <p><span className="text-slate-500 font-bold">{t('footer.biz_phone')}</span> 8083081792</p>
                 </div>
             </div>
             <div className="mt-8 pt-4 border-t border-white/40 text-center">
                 <p className="text-slate-500 font-medium text-xs">© 2026 Ocean Star. All Rights Reserved.</p>
             </div>
          </Reveal>
        </section>

        {/* Google Ads Phone Tracking */}
        <Script id="google-ads-phone" strategy="afterInteractive">
          {`
            gtag('config', 'AW-17755406251/EJ-PCOS-28UcEKv_t5JC', { 
              'phone_conversion_number': '1 8083081792' 
            }); 
          `}
        </Script>
      </main>

      {/* 플로팅 예약 버튼 - main 바깥에 위치하여 iOS 스크롤 점프 방지 */}
      {!isBookingOpen && !isReviewOpen && (
        <div className="w-full shrink-0 pl-2 pr-[90px] py-3 sm:pl-4 sm:pr-[100px] sm:py-4 bg-white/40 backdrop-blur-xl border-t border-white/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex justify-center">
          <div className="max-w-[1600px] w-full flex justify-between items-center gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{t('floater.subtitle')}</p>
              <p className="text-sm sm:text-xl font-extrabold text-blue-600 leading-tight line-clamp-2">{t('floater.title')}</p>
            </div>
            <button
              onClick={() => setIsBookingOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 sm:py-3.5 sm:px-8 rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0"
            >
              {t('floater.btn')} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* === 예약 플로팅 모달 (Booking Drawer/Modal) === */}
      {isBookingOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-safe animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm transition-opacity" onClick={() => setIsBookingOpen(false)}></div>
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-[60px] border border-white/70 shadow-[inset_0_0_30px_rgba(255,255,255,0.8),0_20px_60px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="bg-white/30 backdrop-blur-md px-6 py-5 border-b border-white/60 shadow-sm flex justify-between items-center z-10 shrink-0">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black text-sky-900 drop-shadow-sm">{t('bookingModal.title')}</h2>
                </div>
                <button type="button" onClick={() => setIsBookingOpen(false)} className="p-2 bg-white/50 hover:bg-white/80 rounded-full text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 pb-32 overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit)(); }} className="flex flex-col h-full">
                  
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                      {/* Step 1: Tour Selection */}
                        <section className="bg-white/30 backdrop-blur-[20px] p-6 rounded-[2rem] shadow-[inset_0_0_15px_rgba(255,255,255,0.6)] border border-white/60">
                          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-sky-900 drop-shadow-sm">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-600 text-white text-sm font-black shadow-md">1</span>
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
                              setTimeout(() => {
                                paxSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                form.setFocus("adultCount");
                              }, 150);
                            }}
                            className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedTour === tour.tour_id
                              ? "border-sky-500 bg-white/70 backdrop-blur-md shadow-md scale-[1.02] transform"
                              : "border-white/50 bg-white/40 backdrop-blur-sm hover:border-sky-300 hover:bg-white/60"
                              }`}
                          >
                            {selectedTour === tour.tour_id && (
                              <div className="absolute top-3 right-3 text-blue-600 bg-white rounded-full p-0.5 shadow-sm">
                                <Check size={16} strokeWidth={3} />
                              </div>
                            )}
                            <h3 className="font-bold text-base mb-1 text-slate-800">
                              {getTourNameByLang(tour.tour_id, tour.name, lang)}
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

                    {/* 1.5. Combo Option Selection */}
                    {selectedTour === 'combo_marine' && (
                      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black">1.5</span>
                          {lang === 'en' ? 'Select Combo Option' : '콤보 세부 옵션 선택'}
                        </h2>
                        <div className="flex flex-col gap-3">
                          {[
                            { id: '1', label: lang === 'en' ? 'Turtle Snorkeling + Parasailing ($210)' : '거북이 스노클링 + 패러세일링 ($210)' },
                            { id: '2', label: lang === 'en' ? 'Turtle Snorkeling + Jet Ski ($210)' : '거북이 스노클링 + 제트 스키 ($210)' },
                            { id: '3', label: lang === 'en' ? 'Turtle Snorkeling + Parasailing + Jet Ski ($310)' : '거북이 스노클링 + 패러세일링 + 제트스키 ($310)' }
                          ].map(opt => (
                            <div 
                               key={opt.id}
                               onClick={() => {
                                 setComboOption(opt.id);
                                 form.setValue("comboOption", opt.id);
                               }}
                               className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${comboOption === opt.id ? "border-sky-500 bg-white/70 backdrop-blur-md shadow-sm" : "border-white/50 bg-white/40 backdrop-blur-sm hover:border-sky-300"}`}
                            >
                               {comboOption === opt.id && (
                                  <div className="absolute top-1/2 -translate-y-1/2 right-4 text-blue-600">
                                    <Check size={20} strokeWidth={3} />
                                  </div>
                               )}
                               <p className="font-bold text-slate-800">{opt.label}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* 1.6 Combo Time Option Selection */}
                    {selectedTour === 'combo_marine' && comboOption && (
                      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black">1.6</span>
                          {lang === 'en' ? 'Select Snorkeling Trip Time' : '거북이 스노클링 시간 선택'}
                        </h2>
                        <div className="flex flex-col gap-3">
                          {[
                            { id: 'morning1', label: lang === 'en' ? '1st Trip (08:00 AM)' : '1부 (08:00 AM)' },
                            { id: 'morning2', label: lang === 'en' ? '2nd Trip (11:00 AM)' : '2부 (11:00 AM)' }
                          ].map(opt => (
                            <div 
                               key={opt.id}
                               onClick={() => {
                                 setComboTimeOption(opt.id);
                                 form.setValue("comboTimeOption", opt.id);
                                 setTimeout(() => {
                                    paxSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                 }, 150);
                               }}
                               className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${comboTimeOption === opt.id ? "border-sky-500 bg-white/70 backdrop-blur-md shadow-sm" : "border-white/50 bg-white/40 backdrop-blur-sm hover:border-sky-300"}`}
                            >
                               {comboTimeOption === opt.id && (
                                  <div className="absolute top-1/2 -translate-y-1/2 right-4 text-blue-600">
                                    <Check size={20} strokeWidth={3} />
                                  </div>
                               )}
                               <p className="font-bold text-slate-800">{opt.label}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                      {/* 2. Pax Selection */}
                      {(selectedTour !== 'combo_marine' || (selectedTour === 'combo_marine' && comboTimeOption)) && (
                        <section ref={paxSectionRef} className="bg-white/60 p-6 rounded-3xl shadow-sm border border-white/50">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-sky-950">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-500 text-white text-sm font-black">2</span>
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
                        <section ref={infoSectionRef} className="bg-white/60 p-6 rounded-3xl shadow-sm border border-white/50">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-sky-950">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-500 text-white text-sm font-black">4</span>
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
                                        {...form.register("hotelName", { onBlur: handleHotelBlur })}
                                        placeholder={t('bookingModal.hotel_placeholder')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                                        />
                                    </Autocomplete>
                                    ) : (
                                    <input
                                        type="text"
                                        {...form.register("hotelName", { onBlur: handleHotelBlur })}
                                        placeholder={t('bookingModal.hotel_placeholder')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                                    />
                                    )}
                                    <p className="text-xs text-slate-500 mt-1.5">{t('bookingModal.hotel_helper')}</p>
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

                          <p className="text-xs text-slate-500 flex items-start gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-500 mt-0.5 shrink-0" /> {t('bookingModal.safe_notice')}
                          </p>
                        </div>
                      </section>
                    )}

                    {/* 5. Secondary Tour Date & Pickup (Combo only) */}
                    {selectedTour === 'combo_marine' && selectedDate && comboOption && (
                      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-black">5</span>
                          {lang === 'en' ? 'Second Activity Booking Info' : '패러세일링/제트스키 예약 정보'}
                        </h2>

                        <div className="space-y-6">
                           <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">{lang === 'en' ? 'Select Date (Excluding Weekends/Holidays)' : '이용 날짜 선택 (주말 및 공휴일 불가)'}</label>
                             <div className="flex justify-center border-2 border-slate-100 rounded-2xl p-4 bg-slate-50/50 shadow-inner">
                               <DayPicker
                                 mode="single"
                                 selected={secondaryDate}
                                 onMonthChange={setSecondaryCurrentMonth}
                                 onSelect={(date) => {
                                   setSecondaryDate(date);
                                   if (date) {
                                     form.setValue("secondaryDate", date, { shouldValidate: true });
                                   }
                                 }}
                                 disabled={(date) => {
                                   if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                                   const day = date.getDay();
                                   if (day === 0 || day === 6) return true; // Disable weekends
                                   
                                   const dateStr = format(date, 'yyyy-MM-dd');
                                   
                                   // Prevent selecting the same date as the primary tour (Turtle Snorkeling)
                                   if (selectedDate && dateStr === format(selectedDate, 'yyyy-MM-dd')) return true;

                                   const isBlocked = blockedDates.some(bd =>
                                     bd.date === dateStr && (bd.tour_id === 'all' || bd.tour_id === 'combo_marine')
                                   );
                                   if (isBlocked) return true;

                                   return false;
                                 }}
                                 className="bg-white p-2 sm:p-4 rounded-xl shadow-sm"
                                 classNames={{
                                   today: "font-black text-blue-600 bg-blue-50 rounded-lg",
                                   selected: "bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md",
                                 }}
                               />
                             </div>
                           </div>

                           <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 mt-6">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <MapPin size={16} className="text-blue-500" /> {lang === 'en' ? 'Pickup Hotel/Location' : '픽업 받을 호텔/장소 입력'}
                                    </label>
                                    {isLoaded ? (
                                    <Autocomplete
                                        onLoad={onSecondaryLoad}
                                        onPlaceChanged={onSecondaryPlaceChanged}
                                    >
                                        <input
                                        type="text"
                                        {...form.register("secondaryPickupLocationName", { onBlur: handleSecondaryHotelBlur })}
                                        placeholder={t('bookingModal.hotel_placeholder')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                                        />
                                    </Autocomplete>
                                    ) : (
                                    <input
                                        type="text"
                                        {...form.register("secondaryPickupLocationName", { onBlur: handleSecondaryHotelBlur })}
                                        placeholder={t('bookingModal.hotel_placeholder')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                                    />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('bookingModal.pickup_label')}</label>
                                    <select
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer font-medium"
                                    value={secondaryClosestPickup?.location?.id || ""}
                                    onChange={(e) => {
                                        const selectedLoc = pickupLocations.find(loc => loc.id === e.target.value);
                                        if (selectedLoc) {
                                          setSecondaryClosestPickup({
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
                                        </option>
                                    ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                      </section>
                    )}
                      </div>
                </form>
              </div>

              {/* Wizard Navigation Footer */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/40 backdrop-blur-xl border-t border-white/50 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] z-[110] animate-in slide-in-from-bottom duration-300">
                  <div className="max-w-[700px] mx-auto flex justify-between items-center">
                    <div></div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col text-right hidden sm:flex">
                            <span className="text-xs font-bold text-slate-500">{t('bookingModal.total_payment')}</span>
                            <span className="text-xl font-black text-blue-600">{lang === 'en' ? '$' : '₩'}{totalPrice.toLocaleString()}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => form.handleSubmit(onSubmit)()}
                            disabled={isSubmitting}
                            className="px-6 py-3 sm:px-8 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
                            {isSubmitting ? t('bookingModal.waiting') : t('bookingModal.checkout_btn')}
                        </button>
                    </div>
                  </div>
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
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('reviewModal.order_id')}</label>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder={t('reviewModal.order_id_placeholder')}
                            value={reviewForm.order_id}
                            onChange={(e) => setReviewForm({ ...reviewForm, order_id: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase tracking-widest font-mono font-bold"
                        />
                        <p className="text-xs text-slate-500 mt-1">{t('reviewModal.order_id_desc')}</p>
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
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('reviewModal.photo_label')}</label>
                        <input
                            type="file"
                            multiple
                            accept="image/png, image/jpeg, image/webp"
                            onChange={(e) => {
                                if (e.target.files) {
                                    const files = Array.from(e.target.files);
                                    if (files.length > 5) {
                                        alert(lang === 'en' ? "You can select up to 5 photos." : "사진은 최대 5장까지만 선택할 수 있습니다.");
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
                            {isSubmittingReview ? t('reviewModal.submitting') : t('reviewModal.submitBtn')}
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
                             <p className="font-bold text-slate-700 text-lg sm:text-xl mb-2 text-center">{t('tourDetailsModal.no_info')}</p>
                             <p className="text-slate-500 text-sm text-center max-w-md leading-relaxed px-4">
                                 {t('tourDetailsModal.no_info_desc')}
                             </p>
                         </div>
                     )}
                 </div>
                 {/* Modal Footer */}
                 <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-3">
                     <button onClick={() => setExpandedTourDetails(null)} className="px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors w-full sm:w-auto text-center">
                         {t('tourDetailsModal.close')}
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
                        className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 w-full sm:w-auto text-center"
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
