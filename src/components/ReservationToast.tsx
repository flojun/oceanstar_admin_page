"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BellRing, X, Volume2, VolumeX, Bell, Settings } from "lucide-react";
import { usePushNotification } from "@/hooks/usePushNotification";

interface Toast {
    id: string;
    message: string;
    name: string;
    option: string;
    tourDate: string;
    timestamp: Date;
}

interface NotificationSettings {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    pushEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
    soundEnabled: true,
    vibrationEnabled: true,
    pushEnabled: false,
};

export default function ReservationToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const [showSettings, setShowSettings] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    const { 
        isSupported: pushSupported, 
        isSubscribed: isPushSubscribed,
        permission: pushPermission,
        subscribe: subscribePush,
        unsubscribe: unsubscribePush,
        showLocalNotification,
        isLoading: pushLoading,
    } = usePushNotification();

    useEffect(() => {
        const saved = localStorage.getItem('notification-settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse notification settings:', e);
            }
        }
    }, []);

    const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('notification-settings', JSON.stringify(updated));
            return updated;
        });
    }, []);

    useEffect(() => {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.5;
        audioRef.current.onerror = () => {
            console.log('Notification sound file not found, using synthesized sound');
        };

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const playBeep = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.error('Web Audio API not supported:', e);
        }
    }, []);

    const playSound = useCallback(() => {
        if (!settings.soundEnabled) return;

        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => playBeep());
            } else {
                playBeep();
            }
        } catch (e) {
            console.error('Failed to play sound:', e);
        }
    }, [settings.soundEnabled, playBeep]);

    const triggerVibration = useCallback(() => {
        if (!settings.vibrationEnabled) return;

        try {
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        } catch (e) {
            console.error('Vibration not supported:', e);
        }
    }, [settings.vibrationEnabled]);

    const handlePushToggle = async () => {
        if (isPushSubscribed) {
            await unsubscribePush();
            updateSettings({ pushEnabled: false });
        } else {
            const success = await subscribePush();
            if (success) {
                updateSettings({ pushEnabled: true });
            }
        }
    };

    useEffect(() => {
        const channel = supabase
            .channel("reservation_toast_enhanced")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "reservations" },
                (payload) => {
                    const newReservation = payload.new as any;
                    const name = newReservation?.name || "고객";
                    const option = newReservation?.option || "";
                    const tourDate = newReservation?.tour_date || "";
                    
                    const toast: Toast = {
                        id: crypto.randomUUID(),
                        message: `🔔 새로운 예약이 들어왔습니다!`,
                        name,
                        option,
                        tourDate,
                        timestamp: new Date(),
                    };
                    
                    setToasts(prev => [...prev, toast]);
                    playSound();
                    triggerVibration();

                    if (settings.pushEnabled && document.hidden && pushPermission === 'granted') {
                        showLocalNotification(`🔔 새 예약: ${name}`, {
                            body: `${option ? option + ' · ' : ''}${tourDate}`,
                            tag: 'new-reservation',
                        });
                    }

                    setTimeout(() => {
                        setToasts(prev => prev.filter(t => t.id !== toast.id));
                    }, 8000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [playSound, triggerVibration, settings.pushEnabled, pushPermission, showLocalNotification]);

    const dismiss = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const dismissAll = () => {
        setToasts([]);
    };

    return (
        <>
            {/* Settings Button */}
            <button
                onClick={() => setShowSettings(true)}
                className="fixed bottom-6 right-6 z-[9998] p-3 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                title="알림 설정"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {(isPushSubscribed || settings.soundEnabled) && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
            </button>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setShowSettings(false)}>
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-600" />
                                알림 설정
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                새 예약이 들어올 때 알림을 받습니다
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Sound Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {settings.soundEnabled ? (
                                        <Volume2 className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <VolumeX className="w-5 h-5 text-gray-400" />
                                    )}
                                    <div>
                                        <p className="font-medium text-gray-800">알림음</p>
                                        <p className="text-xs text-gray-500">새 예약 시 소리 알림</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${
                                        settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Vibration Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <svg className={`w-5 h-5 ${settings.vibrationEnabled ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-gray-800">진동</p>
                                        <p className="text-xs text-gray-500">모바일 기기 진동</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${
                                        settings.vibrationEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                        settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Push Notification Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BellRing className={`w-5 h-5 ${isPushSubscribed ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <div>
                                        <p className="font-medium text-gray-800">푸시 알림</p>
                                        <p className="text-xs text-gray-500">
                                            {!pushSupported 
                                                ? '이 브라우저에서 지원되지 않음'
                                                : pushPermission === 'denied'
                                                    ? '브라우저 설정에서 허용 필요'
                                                    : '화면이 꺼져 있어도 알림 수신'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handlePushToggle}
                                    disabled={!pushSupported || pushPermission === 'denied' || pushLoading}
                                    className={`relative w-12 h-7 rounded-full transition-colors ${
                                        isPushSubscribed ? 'bg-blue-600' : 'bg-gray-300'
                                    } ${(!pushSupported || pushPermission === 'denied') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                        isPushSubscribed ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Test Button */}
                            <div className="pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        playSound();
                                        triggerVibration();
                                        const testToast: Toast = {
                                            id: crypto.randomUUID(),
                                            message: '🔔 테스트 알림입니다!',
                                            name: '테스트',
                                            option: '1부',
                                            tourDate: new Date().toISOString().split('T')[0],
                                            timestamp: new Date(),
                                        };
                                        setToasts(prev => [...prev, testToast]);
                                        setTimeout(() => {
                                            setToasts(prev => prev.filter(t => t.id !== testToast.id));
                                        }, 5000);
                                    }}
                                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                                >
                                    테스트 알림 보내기
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                완료
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            {toasts.length > 0 && (
                <div className="fixed bottom-20 left-6 z-[9999] flex flex-col gap-3 max-w-sm">
                    {toasts.length > 1 && (
                        <button
                            onClick={dismissAll}
                            className="self-start text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur rounded-full shadow"
                        >
                            <X className="w-3 h-3" />
                            모두 닫기 ({toasts.length})
                        </button>
                    )}

                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className="flex flex-col bg-white border-l-4 border-blue-500 shadow-xl rounded-xl px-4 py-3 animate-in slide-in-from-left fade-in duration-300"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-full shrink-0">
                                    <BellRing className="w-5 h-5 text-blue-600 animate-pulse" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800">{toast.message}</p>
                                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                            {toast.name}
                                        </span>
                                        {toast.option && (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                {toast.option}
                                            </span>
                                        )}
                                        {toast.tourDate && (
                                            <span className="text-gray-500">{toast.tourDate}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => dismiss(toast.id)}
                                    className="text-gray-400 hover:text-gray-600 shrink-0 p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500"
                                    style={{ animation: 'shrink 8s linear forwards' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx global>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </>
    );
}
