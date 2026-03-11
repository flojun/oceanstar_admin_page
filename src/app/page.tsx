"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, MapPin, Calendar, Users, CreditCard, Loader2 } from "lucide-react";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { calculateDistance, findClosestPickup, PickupLocation, getWalkingMinutes } from '@/lib/utils';

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse } from "date-fns";
import { X, ChevronRight, Info } from "lucide-react";
import Image from "next/image";

// Helper to format HH:mm:ss string to "hh:mm a"
const formatTimeAMPM = (timeString: string | null | undefined) => {
  if (!timeString) return '';
  try {
    const parsed = parse(timeString, 'HH:mm:ss', new Date());
    if (isNaN(parsed.getTime())) {
      // Fallback for HH:mm if seconds are missing
      const parsedShort = parse(timeString, 'HH:mm', new Date());
      return format(parsedShort, 'hh:mm a');
    }
    return format(parsed, 'hh:mm a');
  } catch (e) {
    return timeString; // Return as-is if parsing fails
  }
};

const formSchema = z.object({
  tourDate: z.date(),
  adultCount: z.number().min(1, "성인 1명 이상 선택해주세요"),
  childCount: z.number().min(0),
  hotelName: z.string().min(1, "숙소를 입력해주세요"),
  bookerName: z.string().min(1, "예약자 성함을 입력해주세요"),
  bookerEmail: z.string().email("정확한 이메일을 입력해주세요"),
  bookerPhone: z.string().min(10, "연락처를 입력해주세요"),
});

const libraries: "places"[] = ["places"];

export default function ReservationPage() {
  const [selectedTour, setSelectedTour] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [closestPickup, setClosestPickup] = useState<{ location: PickupLocation, minutes: number } | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const infoSectionRef = useRef<HTMLElement>(null);

  // Modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Capacity Tracking State
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availabilities, setAvailabilities] = useState<Record<string, { booked: number, remaining: number, isAvailable: boolean }>>({});
  const [maxCapacity, setMaxCapacity] = useState(45);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Dynamic Settings Server State
  const [tourSettings, setTourSettings] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ date: string; tour_id: string; reason: string | null }[]>([]);

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
  }, []);

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

  // Watch pax counts for capacity checks
  const adultCount = form.watch("adultCount");
  const childCount = form.watch("childCount");
  const totalSelectedPax = (adultCount || 0) + (childCount || 0);

  // Fetch Available Capacity
  const fetchAvailability = useCallback(async (tourId: string, targetDate: Date) => {
    setIsLoadingAvailability(true);
    try {
      let optionLabel = tourId; // Backend now uses tour_id directly or we'll map it to name
      // Safely find the name locally
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
      setIsLoadingAvailability(true); // Artificial delay to ensure user sees transition, we'll reset it shortly
      setTimeout(() => setIsLoadingAvailability(false), 300);
    }
  }, []);

  // Re-fetch when tour changes or month navigates
  useEffect(() => {
    if (selectedTour) {
      fetchAvailability(selectedTour, currentMonth);
      // Reset selected date if they change the tour option
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

        // Find closest pickup
        const result = findClosestPickup(lat, lng, pickupLocations);
        if (result) {
          setClosestPickup({
            location: result.closestLocation,
            minutes: getWalkingMinutes(result.distanceMeters)
          });
        }
      }
    } else {
      console.log('Autocomplete is not loaded yet!');
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

  const totalPrice = isFlatRate ? currentAdultPrice : (form.watch("adultCount") * currentAdultPrice) + (form.watch("childCount") * currentChildPrice);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedTour) {
      alert("투어 옵션을 먼저 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert date to YYYY-MM-DD string format for DB & Eximbay checkout compatibility
      const formattedDate = format(values.tourDate, "yyyy-MM-dd");

      const response = await fetch('/api/eximbay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedTour,
          pickupLocationId: closestPickup?.location?.id,
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            "name": "하와이 오션스타 거북이 스노클링 투어",
            "description": "와이키키 출발 하와이 최고의 바다거북 스노클링 및 해양 액티비티",
            "provider": {
              "@type": "Organization",
              "name": "Ocean Star Hawaii"
            },
            "offers": {
              "@type": "Offer",
              "price": "115",
              "priceCurrency": "USD"
            }
          })
        }}
      />
      <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1600px] 2xl:max-w-[2200px] mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600 tracking-tight">Ocean Star</h1>
          <p className="text-sm font-medium text-slate-500 hidden sm:block">하와이 거북이 스노클링 예약</p>
        </div>
      </header>

      <main className="max-w-[1600px] 2xl:max-w-[2200px] mx-auto px-4 py-8 sm:px-6 lg:px-8 pb-32">
        {/* === 메인 상품 설명 영역 (기존 홈페이지 내용 통합) === */}
        <div className="w-full lg:w-2/3 xl:w-3/4 mx-auto space-y-12 mb-16">
          <div className="aspect-[21/9] bg-blue-100 rounded-3xl overflow-hidden relative shadow-lg">
            {/* TODO: Add proper hero image here later */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent flex items-end p-8 z-10">
              <h1 className="text-white text-3xl font-bold">오션스타 하와이 거북이 스노클링 & 해양 액티비티</h1>
            </div>
            {/* Fallback pattern for now, should be replaced with actual image src when available */}
            <div className="absolute inset-0 bg-blue-200">
               {/* <Image src="/hero-image.jpg" alt="하와이 와이키키 거북이 스노클링 오션스타 투어" fill className="object-cover" priority /> */}
            </div>
          </div>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Info className="text-blue-500" /> 상세소개 (Detail)</h2>
            <p className="text-lg text-slate-700 leading-relaxed mb-6">
              ✨ <strong>하와이에서 가장 사랑받는 No.1 액티비티!</strong> ✨<br />
              하와이의 중심, 와이키키 터틀 캐니언에서 거북이 스노클링과 다양한 해양 액티비티 5종을 한번에 즐겨보세요.<br />
              가족, 연인, 친구와 함께 잊지 못할 특별한 추억을 만들어보세요!
            </p>

            <div className="bg-blue-50/50 p-6 rounded-2xl mb-8">
              <h4 className="font-bold text-blue-900 mb-4">포함사항 (Included)</h4>
              <ul className="space-y-2 text-slate-700 list-disc list-inside">
                <li>거북이 스노클링, 카약, 스탠드업 패들보드, 보트 다이빙, 씨드 스쿠터, 씨체어 튜브</li>
                <li>친절하고 전문적인 가이드와 함께하는 투어로 수영 걱정 X</li>
                <li>와이키키내 무료 차량 서비스</li>
                <li>구명조끼 및 스노클링 장비 제공</li>
                <li>간단한 스낵과 라면 (추가 음료 및 음식은 자유롭게 지참 가능)</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl mb-8">
              <h4 className="font-bold text-slate-900 mb-4">불포함내역 (Non-Included)</h4>
              <ul className="space-y-2 text-slate-600 list-disc list-inside">
                <li>안전요원 가이드 팁</li>
                <li>고프로 대여 비용 / 개별 점심식사</li>
              </ul>
            </div>

            <h3 className="font-bold text-xl text-slate-900 mt-10 mb-4">투어 스케줄 (Tour Schedule)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-100 p-5 rounded-2xl bg-white shadow-sm">
                <h4 className="font-bold text-blue-600 mb-3 border-b pb-2">모닝 투어 (08:30 ~ 11:00)</h4>
                <ul className="text-sm space-y-2 text-slate-600">
                  <li><span className="font-semibold text-slate-800">07:40 - 07:50 AM</span> Kewalo Harbor 체크인</li>
                  <li><span className="font-semibold text-slate-800">08:00 AM</span> 보트 출발</li>
                  <li><span className="font-semibold text-slate-800">11:00 AM</span> 하버 도착</li>
                </ul>
              </div>
              <div className="border border-slate-100 p-5 rounded-2xl bg-white shadow-sm">
                <h4 className="font-bold text-blue-600 mb-3 border-b pb-2">오후 투어 (11:30 ~ 14:00)</h4>
                <ul className="text-sm space-y-2 text-slate-600">
                  <li><span className="font-semibold text-slate-800">10:40 - 10:50 AM</span> Kewalo Harbor 체크인</li>
                  <li><span className="font-semibold text-slate-800">11:00 AM</span> 보트 출발</li>
                  <li><span className="font-semibold text-slate-800">14:00 PM</span> 하버 도착</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-sm text-slate-500 bg-red-50 text-red-700 p-4 rounded-xl">
              <strong>취소규정 (Cancelation Policy)</strong><br />
              출항 48시간 이내 취소 시에는 환불이 불가합니다. 이메일을 통한 취소는 불가능하므로 반드시 전화로 연락해 주시기 바랍니다. 지정된 픽업 및 항구에 늦으실 경우 환불 불가.
            </div>
          </section>
        </div>

        {/* 플로팅 예약 버튼 (모달 열기) */}
        {!isBookingOpen && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 flex justify-center">
            <div className="max-w-[1600px] 2xl:max-w-[2200px] w-full flex justify-between items-center px-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">하와이 최고의 스노클링</p>
                <p className="text-xl font-extrabold text-blue-600">₩{currentAdultPrice.toLocaleString()} <span className="text-sm text-slate-500 font-normal">/ 1인</span></p>
              </div>
              <button
                onClick={() => setIsBookingOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/30 transition-transform active:scale-95 flex items-center gap-2"
              >
                예약하기 <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* === 예약 플로팅 모달 (Booking Drawer/Modal) === */}
        {isBookingOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setIsBookingOpen(false)}></div>
            <div className="relative w-full max-w-[550px] h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-slate-900">투어 예약하기</h2>
                <button onClick={() => setIsBookingOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
                  <div className="space-y-8">
                    {/* 1. Tour Selection */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">1</span>
                        투어 옵션 선택
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tourSettings.filter((t: any) => t.is_active !== false).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)).map((tour: any) => (
                          <div
                            key={tour.tour_id}
                            onClick={() => {
                              setSelectedTour(tour.tour_id);
                              if (tour.is_flat_rate) {
                                form.setValue("childCount", 0);
                              }
                            }}
                            className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedTour === tour.tour_id
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                              }`}
                          >
                            {selectedTour === tour.tour_id && (
                              <div className="absolute top-3 right-3 text-blue-500">
                                <Check size={20} />
                              </div>
                            )}
                            <h3 className="font-bold text-lg mb-1">{tour.name}</h3>
                            <p className="text-sm text-slate-500 mb-2">
                              {tour.is_flat_rate ? `최대 ${tour.max_capacity}인 단독 대관` : `${tour.start_time} - ${tour.end_time || '(종료 미정)'}`}
                            </p>
                            <p className="font-semibold text-blue-600">
                              ₩{tour.adult_price_krw?.toLocaleString()} {tour.is_flat_rate ? '/ 팀' : '/ 성인'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 2. Pax Selection (Moved UP before Date Selection) */}
                    {selectedTour && (
                      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">2</span>
                          상세 인원 선택
                        </h2>
                        <div className={`grid ${isFlatRate ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              {isFlatRate ? <><Users size={16} className="text-blue-500" /> 총 탑승 인원</> : <><Users size={16} className="text-blue-500" /> 성인</>}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={isFlatRate ? selectedTourSetting?.max_capacity : undefined}
                              {...form.register("adultCount", { valueAsNumber: true })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                            {isFlatRate && (
                              <p className="text-xs text-slate-500 mt-1">※ {selectedTourSetting?.name} 예약은 최대 {selectedTourSetting?.max_capacity}명까지 탑승 가능합니다.</p>
                            )}
                          </div>
                          {!isFlatRate && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                아동 (만3-11세)
                              </label>
                              <input
                                type="number"
                                min="0"
                                {...form.register("childCount", { valueAsNumber: true })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              />
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* 3. Date Selection (Now happens after Pax) */}
                    {selectedTour && (
                      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">3</span>
                            예약 날짜 선택
                          </h2>
                          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            최대 정원: {maxCapacity}명
                          </div>
                        </div>

                        <div className="flex justify-center border border-slate-100 rounded-xl p-4 bg-slate-50/50 relative">
                          {isLoadingAvailability && (
                            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                              <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
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
                              // Cannot book past dates
                              if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;

                              // 1. Check Day-of-Week Blocks
                              const currentSetting = tourSettings.find(s => s.tour_id === selectedTour);
                              const blockedDays = currentSetting?.blocked_days || [];
                              if (blockedDays.includes(date.getDay())) return true;

                              const dateStr = format(date, 'yyyy-MM-dd');

                              // 2. Check globally & specifically blocked dates
                              const isBlocked = blockedDates.some(bd =>
                                bd.date === dateStr && (bd.tour_id === 'all' || bd.tour_id === selectedTour)
                              );
                              if (isBlocked) return true;

                              const dayData = availabilities[dateStr];

                              if (dayData && dayData.isAvailable === false) return true;
                              if (isFlatRate) return false; // Flat rate availability is just true/false, checked above

                              // Regular bookings compare pax to remaining spots
                              const remaining = dayData ? dayData.remaining : maxCapacity;
                              return remaining < totalSelectedPax;
                            }}
                            className="bg-white p-4 rounded-xl shadow-xs"
                            classNames={{
                              today: "font-bold text-blue-600",
                              selected: "bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700",
                            }}
                            modifiers={{
                              booked: (date) => {
                                // 1. Check Day-of-Week Blocks
                                const currentSetting = tourSettings.find(s => s.tour_id === selectedTour);
                                const blockedDays = currentSetting?.blocked_days || [];
                                if (blockedDays.includes(date.getDay())) return true;

                                const dateStr = format(date, 'yyyy-MM-dd');

                                // 2. Check specific blocked dates
                                const isBlocked = blockedDates.some(bd =>
                                  bd.date === dateStr && (bd.tour_id === 'all' || bd.tour_id === selectedTour)
                                );
                                if (isBlocked) return true;

                                const dayData = availabilities[dateStr];
                                if (dayData && dayData.isAvailable === false) return true;
                                if (isFlatRate) return false;

                                const remaining = dayData ? dayData.remaining : maxCapacity;
                                return remaining < totalSelectedPax;
                              }
                            }}
                            modifiersStyles={{
                              booked: { textDecoration: 'line-through', color: 'red' }
                            }}
                          />
                        </div>
                        {form.formState.errors.tourDate && <p className="text-red-500 text-xs mt-3 text-center">{form.formState.errors.tourDate.message}</p>}

                        <p className="text-center text-xs text-slate-500 mt-4">
                          선택하신 인원수({totalSelectedPax}명)에 맞춰 예약 가능한 날짜만 활성화됩니다.
                        </p>
                      </section>
                    )}



                    {/* 4. Hotel Pick-up & Info */}
                    {selectedTour && selectedDate && (
                      <section ref={infoSectionRef} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">4</span>
                          숙소 및 예약자 정보
                        </h2>

                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <MapPin size={16} className="text-blue-500" /> 숙소 입력 (픽업 장소 참고용)
                            </label>

                            {/* Autocomplete for hotel input */}
                            {isLoaded ? (
                              <Autocomplete
                                onLoad={onLoad}
                                onPlaceChanged={onPlaceChanged}
                              >
                                <input
                                  type="text"
                                  {...form.register("hotelName")}
                                  placeholder="머무시는 숙소/호텔 이름을 영문으로 입력해주세요"
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                                />
                              </Autocomplete>
                            ) : (
                              <input
                                type="text"
                                {...form.register("hotelName")}
                                placeholder="머무시는 숙소/호텔 이름을 입력해주세요"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                              />
                            )}
                            {form.formState.errors.hotelName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.hotelName.message}</p>}

                            <p className="text-xs text-blue-600 font-medium mt-2 bg-blue-50 p-2 rounded-lg inline-block">※ 원활한 픽업 배정을 위해 구글 자동완성 목록에서 정확히 선택해주세요.</p>
                          </div>

                          {/* Manual pickup selection dropdown */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">픽업 장소 선택</label>
                            <select
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer"
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
                                  {!isFlatRate && selectedTour === 'morning1' && loc.time_1 ? ` (${formatTimeAMPM(loc.time_1)})` : ''}
                                  {!isFlatRate && selectedTour === 'morning2' && loc.time_2 ? ` (${formatTimeAMPM(loc.time_2)})` : ''}
                                  {!isFlatRate && selectedTour === 'sunset' && loc.time_3 ? ` (${formatTimeAMPM(loc.time_3)})` : ''}
                                </option>
                              ))}
                            </select>
                            {isFlatRate && (
                              <p className="text-sm text-blue-600 mt-2 font-medium bg-blue-50 p-2 rounded w-fit">
                                ℹ️ 단독 대관 픽업 시간은 예약 확정 후 개별 안내드립니다.
                              </p>
                            )}
                            {closestPickup && closestPickup.minutes > 0 && (
                              <p className="text-sm text-green-600 mt-2 font-medium">
                                자동 배정됨: 걸어서 약 {closestPickup.minutes}분 거리입니다. (수동 변경 가능)
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">예약자 영문 성함</label>
                              <input
                                type="text"
                                placeholder="e.g. HONG GILDONG"
                                {...form.register("bookerName")}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              />
                              {form.formState.errors.bookerName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.bookerName.message}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">이메일</label>
                              <input
                                type="email"
                                placeholder="바우처 수신용"
                                {...form.register("bookerEmail")}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              />
                              {form.formState.errors.bookerEmail && <p className="text-red-500 text-xs mt-1">{form.formState.errors.bookerEmail.message}</p>}
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-slate-700 mb-2">연락처 (카카오톡 ID 또는 전화번호)</label>
                              <input
                                type="text"
                                placeholder="+82 10-1234-5678"
                                {...form.register("bookerPhone")}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              />
                              {form.formState.errors.bookerPhone && <p className="text-red-500 text-xs mt-1">{form.formState.errors.bookerPhone.message}</p>}
                            </div>
                          </div>
                        </div>
                      </section>
                    )}
                  </div>

                  <div className="w-full mt-8">
                    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 mb-8">
                      <h3 className="text-lg font-bold mb-4 border-b border-slate-100 pb-4 text-slate-900">결제 요약</h3>

                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">선택 투어</span>
                          <span className="font-medium text-slate-900">
                            {selectedTourSetting?.name || '미선택'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">예약 날짜</span>
                          <span className="font-medium text-slate-900 ">{selectedDate ? format(selectedDate, "PPP") : '-'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">인원</span>
                          <span className="font-medium text-slate-900">
                            {isFlatRate ? `총 탑승 인원 ${form.watch("adultCount") || 0}명` : `성인 ${form.watch("adultCount") || 0}명, 아동 ${form.watch("childCount") || 0}명`}
                          </span>
                        </div>
                        {closestPickup && (
                          <div className="flex justify-between text-sm border-t border-slate-50 pt-3">
                            <span className="text-slate-500">픽업 장소</span>
                            <span className="font-medium text-blue-700 text-right max-w-[200px]" title={closestPickup.location.name}>
                              📍 {closestPickup.location.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-4 mb-6">
                        <div className="flex justify-between items-end">
                          <span className="text-slate-500 font-medium">총 결제 금액 (KRW)</span>
                          <div className="text-right">
                            <span className="text-3xl font-extrabold text-blue-600">₩{totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-600/30"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
                        {isSubmitting ? "응답 대기 중..." : "결제하기"}
                      </button>
                      <p className="text-center text-xs text-slate-400 mt-4">
                        엑심베이(Eximbay) 안전 결제로 이동합니다.
                      </p>
                    </div>
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
