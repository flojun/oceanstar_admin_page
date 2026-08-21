"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import { UploadCloud, CheckCircle, AlertCircle, X, Loader2, GripVertical, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

interface TourSetting {
    tour_id: string;
    name: string;
}

interface ImageVersion {
    id: string; // uuid
    version: number;
}

interface VersionsData {
    main_photo?: number;
    [key: string]: any; // option_{tour_id}_list: ImageVersion[]
}

interface ImageRow {
    id: string; // "main_photo" or "option_morning1"
    label: string;
    type: "main" | "option";
    width: number;
    height: number;
}

// Separate component for Sortable Item
function SortableThumbnail({ 
    url, 
    id, 
    onDelete, 
    isDeleting 
}: { 
    url: string; 
    id: string; 
    onDelete: (id: string) => void;
    isDeleting: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : (isDeleting ? 0.5 : 1),
    };

    return (
        <div ref={setNodeRef} style={style} className={`relative group w-32 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200 shrink-0 ${isDragging ? 'z-50 shadow-xl' : 'z-0'}`}>
            <div {...attributes} {...listeners} className="absolute inset-0 cursor-grab active:cursor-grabbing z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/10">
                <GripVertical className="text-white drop-shadow-md w-6 h-6" />
            </div>
            
            <img 
                src={url}
                className="w-full h-full object-cover"
                alt="thumbnail"
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement?.classList.add('bg-gray-100');
                }}
                onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = 'block';
                }}
            />
            
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                disabled={isDeleting}
                className="absolute top-1 right-1 z-20 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all disabled:opacity-100"
            >
                {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            </button>
        </div>
    );
}


export default function WebsiteImagesTable() {
    const [rows, setRows] = useState<ImageRow[]>([]);
    const [versions, setVersions] = useState<VersionsData>({});
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    
    // For drag overlay
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const PUBLIC_URL_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/website-assets`;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }, // 5px drag required to activate (allows clicking delete)
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: tourSettings, error: tsError } = await supabase
                .from("tour_settings")
                .select("tour_id, name")
                .order("display_order");

            if (tsError) throw tsError;

            const fetchedVersions = await fetchVersions();
            setVersions(fetchedVersions);

            const initialRows: ImageRow[] = [
                {
                    id: "main_photo",
                    label: "웹사이트 메인 사진",
                    type: "main",
                    width: 1920,
                    height: 1080,
                }
            ];

            const optionRows: ImageRow[] = (tourSettings || []).map(ts => ({
                id: `option_${ts.tour_id}`,
                label: `투어: ${ts.name}`,
                type: "option",
                width: 1200,
                height: 675,
            }));

            setRows([...initialRows, ...optionRows]);
        } catch (err) {
            console.error("Failed to load data:", err);
            showToast("데이터를 불러오는데 실패했습니다.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchVersions = async (): Promise<VersionsData> => {
        try {
            const res = await fetch(`${PUBLIC_URL_BASE}/versions.json?t=${Date.now()}`, { cache: "no-store" });
            if (!res.ok) {
                if (res.status === 404 || res.status === 400) return {}; 
                throw new Error("Failed to fetch versions.json");
            }
            return await res.json();
        } catch (err) {
            console.error("fetchVersions error:", err);
            return {};
        }
    };

    const saveVersions = async (newVersions: VersionsData) => {
        const versionsBlob = new Blob([JSON.stringify(newVersions)], { type: "application/json" });
        const versionsFile = new File([versionsBlob], "versions.json", { type: "application/json" });

        const { error: jsonError } = await supabase.storage
            .from("website-assets")
            .upload("versions.json", versionsFile, {
                upsert: true,
                cacheControl: "0" 
            });

        if (jsonError) throw jsonError;
    };

    const handleUploadClick = (id: string) => {
        setSelectedTargetId(id);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !selectedTargetId) return;

        const row = rows.find(r => r.id === selectedTargetId);
        if (!row) return;

        // Validation
        const validFiles = files.filter(f => f.type.match(/image\/(jpeg|jpg|png|webp|heic)/i));
        if (validFiles.length !== files.length) {
            showToast("지원되지 않는 파일이 포함되어 제외되었습니다.", "error");
        }
        if (validFiles.length === 0) return;

        setUploadingId(selectedTargetId);
        
        try {
            // 1. Compress all files first
            const compressedFiles = await Promise.all(validFiles.map(async (file) => {
                const options = {
                    maxSizeMB: 2,
                    maxWidthOrHeight: Math.max(row.width, row.height),
                    useWebWorker: true,
                    fileType: "image/jpeg",
                    initialQuality: 0.85,
                };
                return await imageCompression(file, options);
            }));

            // 2. Upload all files to Supabase concurrently
            const uploadedMeta = await Promise.all(compressedFiles.map(async (blob) => {
                const isMultiple = row.type === 'option';
                const fileId = isMultiple ? uuidv4() : "main_photo"; // For main photo, overwrite. For options, use uuid.
                const filename = isMultiple ? `${selectedTargetId}_${fileId}.jpg` : `${fileId}.jpg`;
                const compressedFile = new File([blob], filename, { type: "image/jpeg" });

                const { error: uploadError } = await supabase.storage
                    .from("website-assets")
                    .upload(filename, compressedFile, {
                        upsert: true,
                        cacheControl: "3600",
                        contentType: "image/jpeg"
                    });

                if (uploadError) throw uploadError;
                return { id: fileId, version: Date.now() };
            }));

            // 3. Read-Modify-Write versions.json
            const currentVersions = await fetchVersions();
            
            if (row.type === 'main') {
                currentVersions["main_photo"] = uploadedMeta[0].version;
            } else {
                const listKey = `${selectedTargetId}_list`;
                const existingList: ImageVersion[] = currentVersions[listKey] || [];
                currentVersions[listKey] = [...existingList, ...uploadedMeta];
            }

            await saveVersions(currentVersions);

            // 4. Update UI
            setVersions(currentVersions);
            showToast(`성공적으로 업로드되었습니다.`, "success");

        } catch (err) {
            console.error("Upload error:", err);
            showToast("업로드 중 오류가 발생했습니다.", "error");
        } finally {
            setUploadingId(null);
            setSelectedTargetId(null);
        }
    };

    const handleDelete = async (rowId: string, imageId: string) => {
        // Rollback backup
        const prevVersions = JSON.parse(JSON.stringify(versions));
        setDeletingId(imageId);
        
        try {
            // 1. Optimistic Update UI
            const listKey = `${rowId}_list`;
            const currentList: ImageVersion[] = [...(versions[listKey] || [])];
            const newList = currentList.filter(img => img.id !== imageId);
            
            const updatedVersions = { ...versions, [listKey]: newList };
            setVersions(updatedVersions); // Optimistic UI Update

            // 2. Read-Modify-Write versions.json
            const serverVersions = await fetchVersions();
            serverVersions[listKey] = (serverVersions[listKey] || []).filter((img: ImageVersion) => img.id !== imageId);
            await saveVersions(serverVersions);

            // 3. Garbage Collection (delete actual file)
            const filename = `${rowId}_${imageId}.jpg`;
            const { error: deleteError } = await supabase.storage.from("website-assets").remove([filename]);
            if (deleteError) {
                console.error("Storage GC failed (ignored UI-wise):", deleteError);
            }
            
            showToast("사진이 삭제되었습니다.", "success");
        } catch (err) {
            console.error("Delete error:", err);
            // 4. Rollback on failure
            setVersions(prevVersions);
            showToast("삭제 처리 중 오류가 발생하여 복구되었습니다.", "error");
        } finally {
            setDeletingId(null);
        }
    };

    const handleDragEnd = async (event: DragEndEvent, rowId: string) => {
        const { active, over } = event;
        setActiveDragId(null);
        
        if (over && active.id !== over.id) {
            const listKey = `${rowId}_list`;
            const prevVersions = JSON.parse(JSON.stringify(versions));
            const oldList: ImageVersion[] = [...(versions[listKey] || [])];
            
            const oldIndex = oldList.findIndex((item) => item.id === active.id);
            const newIndex = oldList.findIndex((item) => item.id === over.id);
            
            const newList = arrayMove(oldList, oldIndex, newIndex);
            
            // 1. Optimistic UI Update
            const updatedVersions = { ...versions, [listKey]: newList };
            setVersions(updatedVersions);

            try {
                // 2. Read-Modify-Write versions.json
                const serverVersions = await fetchVersions();
                
                // Reconcile in case someone else uploaded while we dragged (Edge Case)
                // Best effort: apply arrayMove to server version if both items still exist
                let serverList: ImageVersion[] = serverVersions[listKey] || [];
                const sOldIndex = serverList.findIndex((item) => item.id === active.id);
                const sNewIndex = serverList.findIndex((item) => item.id === over.id);
                if (sOldIndex !== -1 && sNewIndex !== -1) {
                    serverVersions[listKey] = arrayMove(serverList, sOldIndex, sNewIndex);
                } else {
                    serverVersions[listKey] = newList; // Force overwrite if confused
                }

                await saveVersions(serverVersions);
            } catch (err) {
                console.error("Drag reorder error:", err);
                // 3. Rollback
                setVersions(prevVersions);
                showToast("순서 저장 중 오류가 발생하여 복구되었습니다.", "error");
            }
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
            {/* Hidden File Input for Multiple and Single */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/jpg, image/png, image/webp" 
                multiple={rows.find(r => r.id === selectedTargetId)?.type === 'option'}
                onChange={handleFileChange}
            />

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                        <tr>
                            <th className="px-4 py-3 w-1/4">구분 / 옵션명</th>
                            <th className="px-4 py-3 min-w-[400px]">등록된 이미지 (드래그하여 순서 변경)</th>
                            <th className="px-4 py-3 w-[150px] text-center">권장 규격</th>
                            <th className="px-4 py-3 w-[150px] text-center">단일 사진 관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row) => {
                            const isMultiple = row.type === 'option';
                            const listKey = `${row.id}_list`;
                            const optionImages: ImageVersion[] = versions[listKey] || [];

                            return (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 align-middle">
                                        <div className="font-bold text-gray-900">{row.label}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {isMultiple ? "투어 카드 슬라이더 사진" : "홈페이지 첫 화면 배경"}
                                        </div>
                                    </td>
                                    
                                    <td className="px-4 py-4 align-middle">
                                        {!isMultiple ? (
                                            // Single Image Rendering (Main Photo)
                                            <div className="w-32 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200 relative">
                                                <img 
                                                    src={`${PUBLIC_URL_BASE}/main_photo.jpg?v=${versions.main_photo || Date.now()}`} 
                                                    alt={row.label}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                                                />
                                                {uploadingId === row.id && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // Multiple Images Rendering (Dnd-kit)
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <DndContext 
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragStart={(e) => setActiveDragId(e.active.id as string)}
                                                    onDragEnd={(e) => handleDragEnd(e, row.id)}
                                                    modifiers={[restrictToWindowEdges]}
                                                >
                                                    <SortableContext 
                                                        items={optionImages.map(img => img.id)}
                                                        strategy={horizontalListSortingStrategy}
                                                    >
                                                        {optionImages.map((img) => (
                                                            <SortableThumbnail 
                                                                key={img.id}
                                                                id={img.id}
                                                                url={`${PUBLIC_URL_BASE}/${row.id}_${img.id}.jpg?v=${img.version}`}
                                                                onDelete={(imageId) => handleDelete(row.id, imageId)}
                                                                isDeleting={deletingId === img.id}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                    
                                                    {/* Drag Overlay to render item when dragging */}
                                                    <DragOverlay dropAnimation={null}>
                                                        {activeDragId ? (
                                                            <div className="w-32 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-2xl opacity-80">
                                                                <img 
                                                                    src={`${PUBLIC_URL_BASE}/${row.id}_${activeDragId}.jpg?v=${optionImages.find(i => i.id === activeDragId)?.version}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : null}
                                                    </DragOverlay>
                                                </DndContext>
                                                
                                                {/* Add Image Button for Multiple Mode */}
                                                <button 
                                                    onClick={() => handleUploadClick(row.id)}
                                                    disabled={uploadingId === row.id}
                                                    className="w-32 h-20 bg-white border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50 shrink-0"
                                                >
                                                    {uploadingId === row.id ? (
                                                        <Loader2 className="w-6 h-6 animate-spin mb-1" />
                                                    ) : (
                                                        <Plus className="w-6 h-6 mb-1" />
                                                    )}
                                                    <span className="text-xs font-semibold">사진 추가</span>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    
                                    <td className="px-4 py-4 align-middle text-center text-xs text-gray-600">
                                        <div>{row.width} x {row.height} px (16:9)</div>
                                        <div className="text-gray-400 mt-0.5">최대 2MB / 다중선택 가능</div>
                                    </td>
                                    
                                    <td className="px-4 py-4 align-middle text-center">
                                        {!isMultiple && (
                                            <button
                                                onClick={() => handleUploadClick(row.id)}
                                                disabled={uploadingId !== null}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
                                            >
                                                <UploadCloud className="w-4 h-4" />
                                                {uploadingId === row.id ? "업로드 중..." : "사진 변경"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[999] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-lg shadow-xl text-sm font-bold ${
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
