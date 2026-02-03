"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

type NavigationType = {
    targetUrl: string;
};

interface UnsavedChangesContextType {
    isDirty: boolean;
    setIsDirty: (dirty: boolean) => void;
    handleNavigationAttempt: (targetUrl: string) => void;
    registerSaveHandler: (handler: () => Promise<void>) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
    const [isDirty, setIsDirty] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [saveHandler, setSaveHandler] = useState<(() => Promise<void>) | null>(null);
    const [showModal, setShowModal] = useState(false);

    const router = useRouter();

    const registerSaveHandler = useCallback((handler: () => Promise<void>) => {
        setSaveHandler(() => handler);
    }, []);

    const handleNavigationAttempt = (targetUrl: string) => {
        if (!isDirty) {
            router.push(targetUrl);
            return;
        }
        setPendingNavigation(targetUrl);
        setShowModal(true);
    };

    const confirmSave = async () => {
        if (saveHandler) {
            try {
                await saveHandler();
                // After save, reset dirty
                setIsDirty(false);
                setShowModal(false);
                if (pendingNavigation) router.push(pendingNavigation);
            } catch (e) {
                console.error("Save failed", e);
                alert("저장에 실패했습니다. 다시 시도해주세요.");
                setShowModal(false); // Close modal on error to let user retry manually? Or stay open?
                // Better to close and let them see the error if any, or stay.
                // For now, close and let them stay on page.
            }
        } else {
            // No handler? Just go?
            setIsDirty(false);
            setShowModal(false);
            if (pendingNavigation) router.push(pendingNavigation);
        }
    };

    const confirmDiscard = () => {
        setIsDirty(false);
        setShowModal(false);
        if (pendingNavigation) router.push(pendingNavigation);
    };

    const cancelNavigation = () => {
        // Just close modal, stay here
        setShowModal(false);
        setPendingNavigation(null);
    };

    return (
        <UnsavedChangesContext.Provider value={{ isDirty, setIsDirty, handleNavigationAttempt, registerSaveHandler }}>
            {children}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-yellow-100 rounded-full shrink-0">
                                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">변경사항 저장 확인</h3>
                                    <p className="text-sm text-gray-500">저장하지 않은 변경사항이 있습니다.</p>
                                </div>
                            </div>
                            <p className="text-gray-600 mb-6">
                                다른 페이지로 이동하기 전에 변경사항을 저장하시겠습니까?
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmSave}
                                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    저장 후 이동
                                </button>
                                <button
                                    onClick={confirmDiscard}
                                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                                >
                                    저장하지 않음
                                </button>
                                <button
                                    onClick={cancelNavigation}
                                    className="w-full py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition-colors"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </UnsavedChangesContext.Provider>
    );
}

export function useUnsavedChanges() {
    const context = useContext(UnsavedChangesContext);
    if (context === undefined) {
        throw new Error("useUnsavedChanges must be used within a UnsavedChangesProvider");
    }
    return context;
}
