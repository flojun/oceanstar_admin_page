"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import { UploadCloud, CheckCircle, AlertCircle } from "lucide-react";

interface TourSetting {
    tour_id: string;
    name: string;
}

interface ImageRow {
    id: string; // "main_photo" or "tour_morning1" etc.
    label: string;
    type: "main" | "option";
    width: number;
    height: number;
    version: number;
}

export default function WebsiteImagesTable() {
    const [rows, setRows] = useState<ImageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

    const PUBLIC_URL_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-assets`;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch tour settings
            const { data: tourSettings, error: tsError } = await supabase
                .from("tour_settings")
                .select("tour_id, name")
                .order("display_order");

            if (tsError) throw tsError;

            // 2. Fetch versions.json
            const versions = await fetchVersions();

            // 3. Construct rows
            const initialRows: ImageRow[] = [
                {
                    id: "main_photo",
                    label: "웹사이트 메인 사진",
                    type: "main",
                    width: 1920,
                    height: 1080,
                    version: versions["main_photo"] || Date.now()
                }
            ];

            const optionRows: ImageRow[] = (tourSettings || []).map(ts => ({
                id: `option_${ts.tour_id}`,
                label: `투어: ${ts.name}`,
                type: "option",
                width: 1200,
                height: 675,
                version: versions[`option_${ts.tour_id}`] || Date.now()
            }));

            setRows([...initialRows, ...optionRows]);
        } catch (err) {
            console.error("Failed to load data:", err);
            showToast("데이터를 불러오는데 실패했습니다.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchVersions = async (): Promise<Record<string, number>> => {
        try {
            // Bypass cache to prevent Race Conditions or stale data
            const res = await fetch(`${PUBLIC_URL_BASE}/versions.json?t=${Date.now()}`, { cache: "no-store" });
            if (!res.ok) {
                if (res.status === 404) return {}; // File not created yet
                throw new Error("Failed to fetch versions.json");
            }
            return await res.json();
        } catch (err) {
            console.error("fetchVersions error:", err);
            return {};
        }
    };

    const handleUploadClick = (id: string) => {
        setSelectedTargetId(id);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTargetId) return;

        // File format validation via JS just in case
        if (!file.type.match(/image\/(jpeg|jpg|png|webp|heic)/i)) {
            showToast("지원되지 않는 파일 형식입니다. (JPG, PNG, WEBP 허용)", "error");
            return;
        }

        const row = rows.find(r => r.id === selectedTargetId);
        if (!row) return;

        setUploadingId(selectedTargetId);
        try {
            // 1. Compress & Convert to JPEG
            const options = {
                maxSizeMB: 2,
                maxWidthOrHeight: Math.max(row.width, row.height),
                useWebWorker: true,
                fileType: "image/jpeg",
                initialQuality: 0.85,
                // browser-image-compression automatically handles EXIF orientation!
            };
            
            const compressedBlob = await imageCompression(file, options);
            const compressedFile = new File([compressedBlob], `${selectedTargetId}.jpg`, { type: "image/jpeg" });

            // 2. Upload Image to Supabase
            const { error: uploadError } = await supabase.storage
                .from("website-assets")
                .upload(`${selectedTargetId}.jpg`, compressedFile, {
                    upsert: true,
                    cacheControl: "3600",
                    contentType: "image/jpeg"
                });

            if (uploadError) throw uploadError;

            // 3. Read-Modify-Write versions.json
            const currentVersions = await fetchVersions();
            const newVersion = Date.now();
            currentVersions[selectedTargetId] = newVersion;

            const versionsBlob = new Blob([JSON.stringify(currentVersions)], { type: "application/json" });
            const versionsFile = new File([versionsBlob], "versions.json", { type: "application/json" });

            const { error: jsonError } = await supabase.storage
                .from("website-assets")
                .upload("versions.json", versionsFile, {
                    upsert: true,
                    cacheControl: "0" // Prevent caching of versions.json on Supabase Edge
                });

            if (jsonError) throw jsonError;

            // 4. Update UI
            setRows(prev => prev.map(r => r.id === selectedTargetId ? { ...r, version: newVersion } : r));
            showToast("사진이 성공적으로 변경되었습니다.", "success");

        } catch (err) {
            console.error("Upload error:", err);
            showToast("업로드 중 오류가 발생했습니다.", "error");
        } finally {
            setUploadingId(null);
            setSelectedTargetId(null);
        }
    };

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">데이터를 불러오는 중입니다...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/jpg, image/png, image/webp" 
                onChange={handleFileChange}
            />

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                        <tr>
                            <th className="px-4 py-3 w-1/4">구분 / 옵션명</th>
                            <th className="px-4 py-3 w-1/4 text-center">현재 썸네일</th>
                            <th className="px-4 py-3 w-1/4 text-center">권장 규격</th>
                            <th className="px-4 py-3 w-1/4 text-center">업로드 관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 align-middle">
                                    <div className="font-bold text-gray-900">{row.label}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {row.type === "main" ? "홈페이지 첫 화면 배경" : "예약 모달창 및 상세페이지 대표 이미지"}
                                    </div>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                    <div className="flex justify-center">
                                        <div className="w-32 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200 relative flex items-center justify-center">
                                            {/* We append the version hash to bypass cache. */}
                                            <img 
                                                src={`${PUBLIC_URL_BASE}/${row.id}.jpg?v=${row.version}`} 
                                                alt={row.label}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Hide broken image icon if image doesn't exist yet
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement?.classList.add('bg-gray-100');
                                                }}
                                                onLoad={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'block';
                                                }}
                                            />
                                            {uploadingId === row.id && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 align-middle text-center text-xs text-gray-600">
                                    <div>{row.width} x {row.height} px (16:9)</div>
                                    <div className="text-gray-400 mt-0.5">최대 2MB / JPG 변환됨</div>
                                </td>
                                <td className="px-4 py-4 align-middle text-center">
                                    <button
                                        onClick={() => handleUploadClick(row.id)}
                                        disabled={uploadingId !== null}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        {uploadingId === row.id ? "업로드 중..." : "사진 변경"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg text-sm font-bold ${
                        toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                    }`}>
                        {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {toast.msg}
                    </div>
                </div>
            )}
        </div>
    );
}
