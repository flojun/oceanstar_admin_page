"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, MapPin, Calendar, Info, AlertTriangle } from "lucide-react";
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { findClosestPickup, PickupLocation, getWalkingMinutes } from '@/lib/utils';
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { supabase } from '@/lib/supabase';

const libraries: "places"[] = ["places"];

export default function ManageBookingPage() {
  // Step 1: Verification Form States
  const [resNumber, setResNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // Step 4: Cancellation Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinalConfirmModal, setShowFinalConfirmModal] = useState(false);
  const [hasAgreedToPolicy, setHasAgreedToPolicy] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Step 5: Rescheduling States
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  
  // Real Data State
  const [tourData, setTourData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [newTourDate, setNewTourDate] = useState<Date | undefined>(undefined);
  const [customHotelName, setCustomHotelName] = useState("");
  
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [closestPickup, setClosestPickup] = useState<{ location: PickupLocation, minutes: number } | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [availabilities, setAvailabilities] = useState<Record<string, { booked: number, remaining: number, isAvailable: boolean }>>({});
  const [maxCapacity, setMaxCapacity] = useState(45);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [tourSettings, setTourSettings] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ date: string; tour_id: string; reason: string | null }[]>([]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  // Fetch Database Settings & Pickup Locations
  useEffect(() => {
    fetch('/api/pickup')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setPickupLocations(data);
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
  }, []);

  // Fetch Availability for the selected date timeframe
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
      console.error(e);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [tourSettings]);

  useEffect(() => {
    if (isRescheduling && tourData?.tourId) {
      fetchAvailability(tourData.tourId, currentMonth);
    }
  }, [isRescheduling, currentMonth, fetchAvailability, tourData?.tourId]);


  // 하와이 시각 기준 D-Day 계산
  const calculateDaysUntilTour = (tourDateStr: string) => {
    if (!tourDateStr) return 0;
    
    // 현재 하와이 시각의 '연-월-일'
    const hawaiiNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Pacific/Honolulu" }));
    const todayHawaii = new Date(hawaiiNow.getFullYear(), hawaiiNow.getMonth(), hawaiiNow.getDate());
    
    // 구분자 상관없이 숫자 연,월,일 추출
    const digits = tourDateStr.match(/\d+/g);
    if (!digits || digits.length < 3) return 0;

    const y = parseInt(digits[0], 10);
    const m = parseInt(digits[1], 10);
    const d = parseInt(digits[2], 10);

    const targetHawaii = new Date(y, m - 1, d);
    
    const diffTime = targetHawaii.getTime() - todayHawaii.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilTour = tourData ? calculateDaysUntilTour(tourData.tourDateStr) : 0;

  // 하와이 시간 기준 취소 규정용 룰 계산
  const calculateHoursUntilTour = (tourDate: Date) => {
    if (!tourDate) return 0;
    
    // 현재 하와이 시간 생성
    const hawaiiTimeStr = new Date().toLocaleString("en-US", { timeZone: "Pacific/Honolulu" });
    const hawaiiNow = new Date(hawaiiTimeStr);

    // 투어 당일 자정(00:00, 하와이 시간)으로 설정
    const y = tourDate.getFullYear();
    const m = tourDate.getMonth() + 1;
    const d = tourDate.getDate();
    const tourStartStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00-10:00`;
    const hawaiiTourStart = new Date(tourStartStr);

    const diffTime = hawaiiTourStart.getTime() - hawaiiNow.getTime();
    return diffTime / (1000 * 60 * 60);
  };

  const hoursUntilTour = tourData ? calculateHoursUntilTour(tourData.tourDate) : 0;
  
  let refundStatus = 2; // 0% (2인 이내 및 당일)
  if (hoursUntilTour >= 168) { // >= 7 days
      refundStatus = 0; // 100%
  } else if (hoursUntilTour >= 72) { // >= 3 days
      refundStatus = 1; // 50%
  }

  // 7일(168시간) 전까지만 셀프 일정 변경 가능 (하와이 시간 기준)
  const isRescheduleAvailable = hoursUntilTour >= 168;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resNumber || !email) return;

    setIsVerifying(true);
    try {
        const { data: reservation, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('order_id', resNumber.trim().toUpperCase())
            .ilike('booker_email', email.trim())
            .single();

        if (error || !reservation) {
            alert('일치하는 예약 정보가 없습니다. 예약 번호와 이메일을 확인해주세요.');
            setIsVerifying(false);
            return;
        }

        // 인원 파싱
        let parsedGuests = 0;
        if (reservation.pax) {
             const nums = reservation.pax.match(/\d+/g);
             if (nums) parsedGuests = nums.reduce((acc: number, val: string) => acc + parseInt(val, 10), 0);
        }
        if (parsedGuests === 0) parsedGuests = 1;

        // 투어명/ID 매핑
        let tourId = 'morning1';
        let tourName = reservation.option || '거북이 스노클링';
        
        if (tourName.includes('1부')) tourId = 'morning1';
        else if (tourName.includes('2부')) tourId = 'morning2';
        else if (tourName.includes('단독')) tourId = 'private';

        const pickupLoc = reservation.pickup_location || '';
        
        // 날짜 파싱 오차(UTC 변환 이슈) 방지
        const [y, m, d] = reservation.tour_date.split('-').map(Number);
        const correctLocalDate = new Date(y, m - 1, d);
        
        setTourData({
            tourId,
            tourDate: correctLocalDate, // Keeps exact local date
            tourDateStr: reservation.tour_date, // Raw string 'YYYY-MM-DD' for accurate math
            tourName: tourName,
            guests: parsedGuests,
            hotelName: pickupLoc,
            pickupLocation: pickupLoc,
            pickupTime: "안내됨",
            status: reservation.status,
            name: reservation.name
        });
        
        const matchedPick = pickupLocations.find(l => l.name === pickupLoc);
        if (matchedPick) {
             setClosestPickup({ location: matchedPick, minutes: 0 });
        }
        
        setNewTourDate(correctLocalDate);
        setCurrentMonth(correctLocalDate);
        setCustomHotelName(pickupLoc);

        setIsVerified(true);
    } catch (e) {
        console.error(e);
        alert('조회 중 오류가 발생했습니다.');
    } finally {
        setIsVerifying(false);
    }
  };

  const handleFinalCancel = async () => {
    if (!tourData?.name) {
        alert("예약자명 정보가 누락되었습니다. 새로고침 후 다시 시도해주세요.");
        return;
    }
    
    setIsCancelling(true);
    try {
        const res = await fetch('/api/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: resNumber,
                booker_name: tourData.name,
                reason: "고객 홈페이지 직접 취소 접수"
            })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            alert(`취소 요청 실패: ${data.error}`);
        } else {
            alert("취소 요청이 접수되었습니다. 관리자 확인 후 처리됩니다.");
            setShowFinalConfirmModal(false);
            setShowCancelModal(false);
            setTourData((prev: any) => prev ? { ...prev, status: '취소요청' } : prev);
        }
    } catch (e) {
        console.error(e);
        alert("통신 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
        setIsCancelling(false);
    }
  };

  const formatTimeAMPM = (timeString: string | null | undefined) => {
    if (!timeString) return '';
    try {
        const parts = timeString.split(':');
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (e) {
        return timeString;
    }
  };

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      if (lat && lng) {
        setCustomHotelName(place.name || "");
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 py-6 px-6 text-center">
          <h1 className="text-2xl font-bold text-white">내 예약 관리</h1>
          <p className="text-blue-100 text-sm mt-1">오션스타 하와이 거북이 스노클링</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Step 1: Verification Form */}
          {!isVerified ? (
            <form onSubmit={handleVerify} className="space-y-5">
              <p className="text-gray-600 text-sm mb-4">
                예약 정보 보호를 위해 예약 번호와 이메일을 입력해 주세요.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예약 번호 (영숫자 6자리)</label>
                <input
                  type="text"
                  placeholder="예: MA7MY5"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-black uppercase tracking-widest font-mono font-bold"
                  value={resNumber}
                  onChange={(e) => setResNumber(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일 주소 (Email Address)</label>
                <input
                  type="email"
                  placeholder="예약 시 입력한 이메일"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-200 mt-2 flex justify-center items-center gap-2"
              >
                {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "예약 조회하기"}
              </button>
            </form>
          ) : (
            
            /* Step 2: Reservation Details & Value Reminder */
            <div className="w-full animate-fade-in">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">예약 상세 정보</h2>
              
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p><span className="font-semibold text-gray-800">상태:</span> {tourData?.status || '예약확정'}</p>
                <p><span className="font-semibold text-gray-800">투어명:</span> {tourData?.tourName}</p>
                <p><span className="font-semibold text-gray-800">예약일:</span> {tourData?.tourDate?.toLocaleDateString()} (투어 {daysUntilTour}일 전)</p>
                <p><span className="font-semibold text-gray-800">인원:</span> {tourData?.guests}명</p>
                {/* CRITICAL UI TEXT 1 */}
                <p><span className="font-semibold text-gray-800">픽업 장소:</span><br/> {tourData?.pickupLocation}</p>
              </div>

              {/* CRITICAL UI TEXT 2 */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-sm text-blue-800 flex items-start shadow-sm break-keep">
                <span className="text-xl mr-2">⏳</span>
                <p className="leading-relaxed">
                  <span className="font-bold shrink-0">안내:</span> 투어 일정 변경은 여행일 기준 7일 전까지만 셀프로 가능합니다. <br />
                  <span className="text-xs opacity-90 mt-1 block">(여행일 7일 이내인 경우 카카오톡 비즈니스 채널로 문의 부탁드립니다)</span>
                </p>
              </div>

              {/* Step 3: Action Buttons or Reschedule Form */}
              {!isRescheduling ? (
                <div className="flex flex-col items-center space-y-4">
                  {isRescheduleAvailable ? (
                    <button 
                      onClick={() => setIsRescheduling(true)}
                      className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition duration-300 transform hover:-translate-y-1"
                    >
                      투어일정 / 픽업장소 변경하기 (수수료 없음)
                    </button>
                  ) : (
                    <button className="w-full bg-white text-gray-700 border-2 border-gray-300 font-semibold py-3 px-4 rounded-xl flex justify-center items-center hover:bg-gray-50 transition duration-200">
                      <span>💬 일정 변경은 카카오톡 채널로 문의해주세요</span>
                    </button>
                  )}

                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline decoration-gray-300 underline-offset-4 bg-transparent mt-2 transition"
                  >
                    예약 취소 진행
                  </button>
                </div>
              ) : (
                /* Reschedule Form with Calendar & Google Maps */
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-3">일정 및 픽업 장소 변경</h3>
                  
                  {/* Calendar Widget */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-500" />
                        새로운 투어 날짜 선택
                    </label>
                    <div className="flex justify-center border-2 border-slate-200 rounded-2xl p-4 bg-white relative shadow-inner">
                        {isLoadingAvailability && (
                            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
                            </div>
                        )}
                        <DayPicker
                            mode="single"
                            selected={newTourDate}
                            onMonthChange={setCurrentMonth}
                            onSelect={setNewTourDate}
                            disabled={(date) => {
                                if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                                const currentSetting = tourSettings.find(s => s.tour_id === tourData?.tourId);
                                const blockedDays = currentSetting?.blocked_days || [];
                                if (blockedDays.includes(date.getDay())) return true;

                                const dateStr = format(date, 'yyyy-MM-dd');
                                const isBlocked = blockedDates.some(bd =>
                                    bd.date === dateStr && (bd.tour_id === 'all' || bd.tour_id === tourData?.tourId)
                                );
                                if (isBlocked) return true;

                                const dayData = availabilities[dateStr];
                                if (dayData && dayData.isAvailable === false) return true;

                                const remaining = dayData ? dayData.remaining : maxCapacity;
                                return remaining < (tourData?.guests || 1);
                            }}
                            className="bg-white p-2 rounded-xl"
                            classNames={{
                                today: "font-black text-blue-600 bg-blue-50 rounded-lg",
                                selected: "bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md",
                            }}
                            modifiers={{
                                booked: (date) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const dayData = availabilities[dateStr];
                                    if (dayData && dayData.isAvailable === false) return true;
                                    const remaining = dayData ? dayData.remaining : maxCapacity;
                                    return remaining < (tourData?.guests || 1);
                                }
                            }}
                            modifiersStyles={{
                                booked: { textDecoration: 'line-through', color: '#ef4444', opacity: 0.7 }
                            }}
                        />
                    </div>
                  </div>
                  
                  {/* Google Maps Autocomplete & Select */}
                  <div className="space-y-4 pt-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <MapPin size={18} className="text-blue-500" />
                        새로운 픽업 장소 선택
                    </label>
                    
                    <div>
                        <p className="text-xs text-slate-500 mb-1">기존 숙소명 (변경 가능)</p>
                        {isLoaded ? (
                            <Autocomplete
                            onLoad={onLoad}
                            onPlaceChanged={onPlaceChanged}
                            >
                            <input
                                type="text"
                                placeholder="머무시는 숙소/호텔 이름 입력 (영문)"
                                value={customHotelName}
                                onChange={(e) => setCustomHotelName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                            />
                            </Autocomplete>
                        ) : (
                            <input
                                type="text"
                                placeholder="머무시는 숙소를 입력해주세요"
                                value={customHotelName}
                                onChange={(e) => setCustomHotelName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white font-medium"
                            />
                        )}
                        <p className="text-xs text-blue-600 font-medium mt-1 bg-blue-50 p-1.5 rounded inline-block">※ 구글 자동완성으로 숙소를 치시면 가장 가까운 장소를 추천해 드립니다.</p>
                    </div>

                    <div>
                        <select 
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer font-bold text-slate-800"
                            value={closestPickup?.location?.id || ""}
                            onChange={(e) => {
                                const selectedLoc = pickupLocations.find(loc => loc.id === e.target.value);
                                if (selectedLoc) setClosestPickup({ location: selectedLoc, minutes: 0 });
                            }}
                        >
                            <option value="" disabled>가까운 장소가 추천되거나 직접 골라주세요</option>
                            {pickupLocations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                {loc.name}
                                {tourData?.tourId === 'morning1' && loc.time_1 ? ` (${formatTimeAMPM(loc.time_1)})` : ''}
                                {tourData?.tourId === 'morning2' && loc.time_2 ? ` (${formatTimeAMPM(loc.time_2)})` : ''}
                                </option>
                            ))}
                        </select>
                        {closestPickup && closestPickup.minutes > 0 && (
                            <p className="text-sm text-green-600 mt-2 font-bold bg-green-50 p-2 rounded-lg">
                                ✅ 추천됨: 걸어서 약 {closestPickup.minutes}분 거리입니다.
                            </p>
                        )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-6 border-t border-gray-200">
                    <button 
                      onClick={() => setIsRescheduling(false)}
                      className="w-1/3 bg-white border border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition"
                    >
                      취소
                    </button>
                    <button 
                      onClick={async () => {
                        const dateStr = newTourDate ? format(newTourDate, 'yyyy-MM-dd') : '';
                        if (!dateStr) return alert("새로운 날짜를 선택해주세요.");
                        // Use the selected location name (if from dropdown) or the custom hotel name typed by user
                        let locStr = closestPickup?.location?.name || "";
                        if (!locStr && customHotelName) locStr = customHotelName;
                        if (!locStr) locStr = tourData?.pickupLocation || "";
                        
                        setIsSubmittingReschedule(true);
                        try {
                            const res = await fetch('/api/reschedule', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    order_id: resNumber,
                                    booker_email: email,
                                    new_date: dateStr,
                                    new_pickup: locStr
                                })
                            });
                            const data = await res.json();
                            if (!res.ok) {
                                alert(`오류가 발생했습니다:\n${data.error}`);
                            } else {
                                alert(`선택하신 날짜(${dateStr})와 픽업 장소(${locStr})로 변경 접수되었습니다! 관리자 승인 후 최종 확정됩니다.`);
                                setIsRescheduling(false);
                            }
                        } catch (e) {
                            alert("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                        } finally {
                            setIsSubmittingReschedule(false);
                        }
                      }}
                      disabled={isSubmittingReschedule}
                      className="w-2/3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
                    >
                      {isSubmittingReschedule ? <Loader2 className="w-5 h-5 animate-spin" /> : "변경 완료"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 4: Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">예약 취소 요청</h3>
              <p className="text-sm text-gray-500 mb-4">취소 전 하단의 취소 및 환불 규정을 반드시 확인해 주세요.</p>
              
              <div className="bg-gray-100 p-4 rounded-xl h-48 overflow-y-auto text-xs text-gray-600 leading-relaxed mb-5 border border-gray-200">
                <p className="font-bold text-gray-800 mb-2">[취소 및 환불 특약 규정]</p>
                <div className="space-y-2">
                    <p className="font-bold text-blue-800 bg-blue-50 p-2 rounded">본 상품은 국외여행 표준약관 제6조(특약)에 따라 일반 소비자분쟁해결기준과 다른 취소수수료가 적용됩니다. 예약 전 취소 규정을 반드시 확인해 주세요.</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li className={refundStatus === 0 ? "text-red-500 font-bold" : ""}>여행시작 7일 전까지(~7): 여행 요금 전액 환불</li>
                      <li className={refundStatus === 1 ? "text-red-500 font-bold" : ""}>여행시작 3일 전까지(6~3): 상품 요금의 50% 공제</li>
                      <li className={refundStatus === 2 ? "text-red-500 font-bold" : ""}>여행시작 당일까지(2~당일): 취소/환불 불가</li>
                      <li>※ 여행일은 현지 시각 기준입니다.</li>
                    </ul>
                </div>
              </div>

              <label className="flex items-center space-x-3 mb-6 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  checked={hasAgreedToPolicy}
                  onChange={(e) => setHasAgreedToPolicy(e.target.checked)}
                />
                <span className="text-sm font-bold text-gray-700">위 규정을 확인하였으며, 취소에 동의합니다.</span>
              </label>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-300 transition"
                >
                  돌아가기
                </button>
                <button 
                  onClick={() => setShowFinalConfirmModal(true)}
                  disabled={!hasAgreedToPolicy || isCancelling}
                  className={`flex-1 font-bold py-3.5 rounded-xl transition duration-200 flex justify-center items-center gap-2 ${
                    hasAgreedToPolicy && !isCancelling
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md" 
                    : "bg-red-200 text-red-400 cursor-not-allowed"
                  }`}
                >
                  {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : "취소하기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4.5: Final Confirm Modal */}
      {showFinalConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">최종 취소 확인</h3>
              
              <div className="bg-red-50 p-4 rounded-xl text-sm mb-6 border border-red-100">
                <p className="font-bold text-red-800 mb-2">현재 고객님 적용 취소 규정:</p>
                <div className="font-bold text-red-600 text-base bg-white py-2 px-1 rounded shadow-sm border border-red-200 break-keep">
                    {refundStatus === 0 ? "7일 전 접수 (100% 환불 가능)" : 
                     refundStatus === 1 ? "6~3일 전 접수 (50% 공제 후 환불)" : 
                     "2일 이내 및 당일 접수 (취소/환불 불가)"}
                </div>
                <p className="mt-3 text-xs text-red-500 font-medium">※ 하와이 현지 시각 기준으로 계산되었습니다.</p>
              </div>

              <p className="text-gray-600 text-sm mb-6">정말로 예약을 취소하시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.</p>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowFinalConfirmModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-300 transition"
                  disabled={isCancelling}
                >
                  아니오
                </button>
                <button 
                  onClick={handleFinalCancel}
                  disabled={isCancelling}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-md font-bold py-3.5 rounded-xl transition duration-200 flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : "최종 취소 확정"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
