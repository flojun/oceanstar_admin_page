"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PushSubscriptionState {
    isSupported: boolean;
    isSubscribed: boolean;
    isLoading: boolean;
    permission: NotificationPermission | 'default';
    error: string | null;
}

export function usePushNotification() {
    const [state, setState] = useState<PushSubscriptionState>({
        isSupported: false,
        isSubscribed: false,
        isLoading: true,
        permission: 'default',
        error: null,
    });

    useEffect(() => {
        const checkSupport = async () => {
            const isSupported = 
                'serviceWorker' in navigator && 
                'PushManager' in window && 
                'Notification' in window;

            if (!isSupported) {
                setState(prev => ({ 
                    ...prev, 
                    isSupported: false, 
                    isLoading: false,
                    error: '이 브라우저는 푸시 알림을 지원하지 않습니다.'
                }));
                return;
            }

            const permission = Notification.permission;
            
            let isSubscribed = false;
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                isSubscribed = !!subscription;
            } catch (e) {
                console.error('Error checking subscription:', e);
            }

            setState(prev => ({
                ...prev,
                isSupported: true,
                permission,
                isSubscribed,
                isLoading: false,
            }));
        };

        checkSupport();
    }, []);

    const registerServiceWorker = useCallback(async () => {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });
            await navigator.serviceWorker.ready;
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }, []);

    const subscribe = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                setState(prev => ({ 
                    ...prev, 
                    permission, 
                    isLoading: false,
                    error: '알림 권한이 거부되었습니다.'
                }));
                return false;
            }

            await registerServiceWorker();

            setState(prev => ({ 
                ...prev, 
                permission: 'granted',
                isSubscribed: true,
                isLoading: false,
            }));

            return true;
        } catch (error) {
            console.error('Push subscription failed:', error);
            setState(prev => ({ 
                ...prev, 
                isLoading: false,
                error: '푸시 알림 구독에 실패했습니다.'
            }));
            return false;
        }
    }, [registerServiceWorker]);

    const unsubscribe = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
            }

            setState(prev => ({ 
                ...prev, 
                isSubscribed: false,
                isLoading: false,
            }));

            return true;
        } catch (error) {
            console.error('Unsubscribe failed:', error);
            setState(prev => ({ 
                ...prev, 
                isLoading: false,
                error: '구독 해제에 실패했습니다.'
            }));
            return false;
        }
    }, []);

    const showLocalNotification = useCallback(async (title: string, options?: NotificationOptions) => {
        if (Notification.permission !== 'granted') return;

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                icon: '/oceanstar_logo.jpg',
                badge: '/oceanstar_logo.jpg',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                ...options,
            } as any);
        } catch (error) {
            new Notification(title, options);
        }
    }, []);

    return {
        ...state,
        subscribe,
        unsubscribe,
        showLocalNotification,
    };
}
