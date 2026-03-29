"use client";

import { useState, useEffect, useCallback } from "react";

export interface NotificationSettings {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    pushEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
    soundEnabled: true,
    vibrationEnabled: true,
    pushEnabled: false,
};

const STORAGE_KEY = "notification-settings";

export function useNotificationSettings() {
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse notification settings:", e);
            }
        }
    }, []);

    const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...patch };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    return { settings, updateSettings };
}
