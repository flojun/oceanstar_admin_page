"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, MapPin, Calendar, Users, CreditCard, Loader2 } from "lucide-react";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { calculateDistance, findClosestPickup, PickupLocation, getWalkingMinutes } from '@/lib/utils';

const formSchema = z.object({
  tourDate: z.string().min(1, "날짜를 선택해주세요"),
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
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [closestPickup, setClosestPickup] = useState<{ location: PickupLocation, minutes: number } | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tourDate: "",
      adultCount: 1,
      childCount: 0,
      hotelName: "",
      bookerName: "",
      bookerEmail: "",
      bookerPhone: "",
    },
  });

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

  const totalPrice = (form.watch("adultCount") * 100) + (form.watch("childCount") * 80);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedTour) {
      alert("투어 옵션(1부, 2부, 선셋)을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/eximbay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedTour,
          pickupLocationId: closestPickup?.location?.id,
          totalPrice,
          ...values
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
      <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600 tracking-tight">Ocean Star</h1>
          <p className="text-sm font-medium text-slate-500 hidden sm:block">하와이 거북이 스노클링 예약</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-8">

          <div className="flex-1 space-y-8">
            {/* 1. Tour Selection */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">1</span>
                투어 선택
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "morning1", title: "1부 거북이 스노클링", time: "08:00 - 11:00", price: "$100" },
                  { id: "morning2", title: "2부 거북이 스노클링", time: "11:00 - 14:00", price: "$100" },
                  { id: "sunset", title: "선셋 거북이 스노클링", time: "15:00 - 18:00 (시즌 변동)", price: "$100" },
                ].map((tour) => (
                  <div
                    key={tour.id}
                    onClick={() => setSelectedTour(tour.id)}
                    className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedTour === tour.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                      }`}
                  >
                    {selectedTour === tour.id && (
                      <div className="absolute top-3 right-3 text-blue-500">
                        <Check size={20} />
                      </div>
                    )}
                    <h3 className="font-bold text-lg mb-1">{tour.title}</h3>
                    <p className="text-sm text-slate-500 mb-2">{tour.time}</p>
                    <p className="font-semibold text-blue-600">{tour.price}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Date & Pax */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">2</span>
                날짜 및 인원
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" /> 투어 날짜
                  </label>
                  <input
                    type="date"
                    {...form.register("tourDate")}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  {form.formState.errors.tourDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.tourDate.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Users size={16} className="text-blue-500" /> 성인
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...form.register("adultCount", { valueAsNumber: true })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
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
                </div>
              </div>
            </section>

            {/* 3. Hotel Pick-up & Info */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">3</span>
                숙소 및 예약자 정보
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" /> 숙소 입력 (픽업 장소 참고용)
                  </label>

                  <input
                    type="text"
                    {...form.register("hotelName")}
                    placeholder="머무시는 숙소/호텔 이름을 입력해주세요"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  />
                  {form.formState.errors.hotelName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.hotelName.message}</p>}

                  <p className="text-xs text-blue-600 font-medium mt-2 bg-blue-50 p-2 rounded-lg inline-block">※ 원활한 픽업 배정을 위해 정확히 입력해주세요.</p>
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
          </div>

          <div className="lg:w-[380px]">
            <div className="sticky top-24 bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100">
              <h3 className="text-lg font-bold mb-4 border-b border-slate-100 pb-4 text-slate-900">결제 요약</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">선택 투어</span>
                  <span className="font-medium text-slate-900">
                    {selectedTour === 'morning1' ? '1부 (08:00)' :
                      selectedTour === 'morning2' ? '2부 (11:00)' :
                        selectedTour === 'sunset' ? '선셋 스노클링' : '미선택'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">예약 날짜</span>
                  <span className="font-medium text-slate-900">{form.watch("tourDate") || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">인원</span>
                  <span className="font-medium text-slate-900">성인 {form.watch("adultCount") || 0}명, 아동 {form.watch("childCount") || 0}명</span>
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
                  <span className="text-slate-500 font-medium">총 결제 금액</span>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-blue-600">${totalPrice}</span>
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
      </main>
    </div>
  );
}
