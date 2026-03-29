"use client";

import { useRef, useEffect, useCallback } from "react";

export function useNotificationSound(soundEnabled: boolean, vibrationEnabled: boolean) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio("/notification.mp3");
        audioRef.current.volume = 0.5;
        audioRef.current.onerror = () => {
            console.log("Notification sound file not found, using synthesized sound");
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
            oscillator.type = "sine";
            gainNode.gain.value = 0.3;

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.error("Web Audio API not supported:", e);
        }
    }, []);

    const playSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => playBeep());
            } else {
                playBeep();
            }
        } catch (e) {
            console.error("Failed to play sound:", e);
        }
    }, [soundEnabled, playBeep]);

    const triggerVibration = useCallback(() => {
        if (!vibrationEnabled) return;
        try {
            if ("vibrate" in navigator) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        } catch (e) {
            console.error("Vibration not supported:", e);
        }
    }, [vibrationEnabled]);

    return { playSound, triggerVibration, playBeep };
}
