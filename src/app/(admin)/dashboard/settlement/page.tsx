"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    PlatformKey,
    PLATFORMS,
    PLATFORM_KEYS,
    SettlementRow,
    MatchResult,
    SettlementSummary,
    ProductPrice,
} from '@/types/settlement';
import { getParser, ParseResult } from '@/lib/settlement/parsers';
import {
    fetchProductPrices,
    fetchAndMergeReservations,
    matchSettlementData,
    calculateSummary,
    confirmSettlement,
} from '@/lib/settlement/matcher';
import { supabase } from '@/lib/supabase';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Loader2,
    RefreshCw,
    Settings,
    Plus,
    Trash2,
    Save,
    X,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---- Color map ----
const COLOR = {
    blue: { tab: 'bg-blue-600 text-white shadow-md', light: 'bg-blue-50 border-blue-200 text-blue-700' },
    green: { tab: 'bg-green-600 text-white shadow-md', light: 'bg-green-50 border-green-200 text-green-700' },
    purple: { tab: 'bg-purple-600 text-white shadow-md', light: 'bg-purple-50 border-purple-200 text-purple-700' },
    orange: { tab: 'bg-orange-600 text-white shadow-md', light: 'bg-orange-50 border-orange-200 text-orange-700' },
} as const;

// ==================================================
// Settlement Page
// ==================================================

export default function SettlementPage() {
    const [currentPlatform, setCurrentPlatform] = useState<PlatformKey>('myRealTrip');
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Data
    const [parsedRows, setParsedRows] = useState<SettlementRow[]>([]);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
    const [summary, setSummary] = useState<SettlementSummary | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modals
    const [showSettings, setShowSettings] = useState(false);
    const [detailResult, setDetailResult] = useState<MatchResult | null>(null);

    // Confirming
    const [isConfirming, setIsConfirming] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const platform = PLATFORMS[currentPlatform];
    const colorKey = platform.color as keyof typeof COLOR;

    const handlePlatformChange = (key: PlatformKey) => {
        setCurrentPlatform(key);
        resetState();
    };

    const resetState = () => {
        setParsedRows([]);
        setParseErrors([]);
        setMatchResults([]);
        setSummary(null);
        setUploadedFileName('');
        setSelectedIds(new Set());
    };

    // ---- File handling ----
    const handleFile = useCallback(async (file: File) => {
        if (!file) return;
        setIsLoading(true);
        setUploadedFileName(file.name);
        setParseErrors([]);
        setMatchResults([]);
        setSummary(null);
        setSelectedIds(new Set());

        try {
            const parser = getParser(currentPlatform);
            const result: ParseResult = await parser(file);
            setParsedRows(result.rows);
            setParseErrors(result.errors);

            if (result.rows.length === 0) { setIsLoading(false); return; }

            // Date range
            const dates = result.rows.map(r => r.tourDate).filter(Boolean).sort();
            const startDate = dates[0];
            const endDate = dates[dates.length - 1];

            // Fetch DB data
            const [dbGroups, productPrices] = await Promise.all([
                fetchAndMergeReservations(platform.sourceCode, startDate, endDate),
                fetchProductPrices(),
            ]);

            // Match
            const results = matchSettlementData(result.rows, dbGroups, productPrices);
            setMatchResults(results);
            setSummary(calculateSummary(results));
        } catch (err) {
            setParseErrors(prev => [...prev, `처리 오류: ${err instanceof Error ? err.message : String(err)}`]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPlatform, platform]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    // ---- Selection ----
    const toggleSelect = (idx: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            const key = String(idx);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === matchResults.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(matchResults.map((_, i) => String(i))));
        }
    };

    // ---- Settlement Confirmation ----
    const handleConfirm = async () => {
        const ids: string[] = [];
        selectedIds.forEach(idx => {
            const r = matchResults[Number(idx)];
            if (r?.dbGroup) {
                ids.push(...r.dbGroup.reservationIds);
            }
        });
        if (ids.length === 0) { alert('확정할 항목을 선택하세요.'); return; }

        if (!confirm(`${ids.length}건의 예약을 '정산완료'로 변경하시겠습니까?`)) return;

        setIsConfirming(true);
        const { success, error } = await confirmSettlement(ids);
        setIsConfirming(false);

        if (success) {
            alert('정산 확정 완료!');
            setSelectedIds(new Set());
        } else {
            alert(`오류: ${error}`);
        }
    };

    // ---- Status helpers ----
    const statusIcon = (s: MatchResult['status']) => {
        switch (s) {
            case 'normal': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
        }
    };

    const statusBg = (s: MatchResult['status']) => {
        switch (s) {
            case 'normal': return '';
            case 'warning': return 'bg-yellow-50/60';
            case 'error': return 'bg-red-50/60';
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">정산 검토</h1>
                    <p className="text-sm text-gray-500 mt-1">플랫폼별 정산 엑셀을 업로드하여 DB 예약 데이터와 자동 비교합니다.</p>
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                >
                    <Settings className="w-4 h-4" /> 기준가 관리
                </button>
            </div>

            {/* Platform Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
                {PLATFORM_KEYS.map(key => {
                    const p = PLATFORMS[key];
                    const isActive = currentPlatform === key;
                    const c = COLOR[p.color as keyof typeof COLOR];
                    return (
                        <button
                            key={key}
                            onClick={() => handlePlatformChange(key)}
                            className={cn(
                                'flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200',
                                isActive ? c.tab : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                            )}
                        >
                            {p.label}
                            {!p.enabled && <span className="ml-1 text-[10px] opacity-60">(준비중)</span>}
                        </button>
                    );
                })}
            </div>

            {/* File Upload */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                    isDragging ? `border-blue-400 bg-blue-50 scale-[1.01]` : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
                    isLoading && 'pointer-events-none opacity-60'
                )}
            >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                        <p className="text-gray-500 font-medium">파일 처리 중...</p>
                    </div>
                ) : uploadedFileName ? (
                    <div className="flex flex-col items-center gap-3">
                        <FileSpreadsheet className="w-10 h-10 text-blue-600" />
                        <p className="font-semibold text-blue-700">{uploadedFileName}</p>
                        <p className="text-xs text-gray-400">다시 업로드하려면 클릭하세요</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <Upload className="w-10 h-10 text-gray-400" />
                        <p className="text-gray-600 font-medium">{platform.label} 정산 엑셀 파일을 드래그하거나 클릭</p>
                        <p className="text-xs text-gray-400">.xlsx, .xls, .csv 지원</p>
                    </div>
                )}
            </div>

            {/* Errors */}
            {parseErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> 파싱 오류 ({parseErrors.length}건)
                    </h3>
                    <ul className="text-sm text-red-600 space-y-1">
                        {parseErrors.map((err, i) => <li key={i}>• {err}</li>)}
                    </ul>
                </div>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-3 gap-3">
                    <SummaryCard label="🟢 정상" value={summary.normal} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} bg="bg-green-50 border-green-200" />
                    <SummaryCard label="🟡 확인필요" value={summary.warning} icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />} bg="bg-yellow-50 border-yellow-200" />
                    <SummaryCard label="🔴 오류" value={summary.error} icon={<XCircle className="w-5 h-5 text-red-500" />} bg="bg-red-50 border-red-200" />
                </div>
            )}

            {/* Amount Summary */}
            {summary && (
                <div className={cn(
                    'rounded-xl border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3',
                    Math.abs(summary.totalDiff) < 1 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                )}>
                    <div>
                        <p className="text-sm font-semibold text-gray-700">금액 요약</p>
                        <p className="text-xs text-gray-500">
                            예상: {summary.totalExpected.toLocaleString()}원 / 실제: {summary.totalActual.toLocaleString()}원
                        </p>
                    </div>
                    <div className={cn(
                        'text-xl font-bold',
                        summary.totalDiff === 0 ? 'text-green-600' : summary.totalDiff > 0 ? 'text-red-600' : 'text-blue-600'
                    )}>
                        {summary.totalDiff > 0 ? '+' : ''}{summary.totalDiff.toLocaleString()}원
                    </div>
                </div>
            )}

            {/* Results Table */}
            {matchResults.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">매칭 결과 ({matchResults.length}건)</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={resetState} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                                <RefreshCw className="w-3.5 h-3.5" /> 초기화
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={selectedIds.size === 0 || isConfirming}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                정산 확정 ({selectedIds.size})
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-3 py-3 text-center w-10">
                                        <input type="checkbox" checked={selectedIds.size === matchResults.length && matchResults.length > 0} onChange={toggleAll} className="rounded" />
                                    </th>
                                    <th className="px-3 py-3 text-left font-semibold">상태</th>
                                    <th className="px-3 py-3 text-left font-semibold">날짜</th>
                                    <th className="px-3 py-3 text-left font-semibold">고객명</th>
                                    <th className="px-3 py-3 text-left font-semibold">판별 상품</th>
                                    <th className="px-3 py-3 text-left font-semibold">병합 옵션</th>
                                    <th className="px-3 py-3 text-center font-semibold">인원</th>
                                    <th className="px-3 py-3 text-right font-semibold">실제금액</th>
                                    <th className="px-3 py-3 text-right font-semibold">예상금액</th>
                                    <th className="px-3 py-3 text-right font-semibold">차액</th>
                                    <th className="px-3 py-3 text-left font-semibold">비고</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {matchResults.map((r, idx) => (
                                    <tr
                                        key={idx}
                                        className={cn('hover:bg-gray-50 transition-colors cursor-pointer', statusBg(r.status))}
                                        onClick={() => setDetailResult(r)}
                                    >
                                        <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" checked={selectedIds.has(String(idx))} onChange={() => toggleSelect(idx)} className="rounded" />
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {statusIcon(r.status)}
                                                <span className="text-xs font-medium">{r.statusLabel}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                                            {r.excelRow?.tourDate || r.dbGroup?.tourDate || '-'}
                                        </td>
                                        <td className="px-3 py-3 text-gray-700">
                                            {r.excelRow?.customerName || r.dbGroup?.name || '-'}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                                                r.matchedProduct?.tier_group === 'Tier 3' ? 'bg-purple-100 text-purple-700' :
                                                    r.matchedProduct?.tier_group === 'Tier 2' ? 'bg-blue-100 text-blue-700' :
                                                        r.classifiedProductName === '(미분류)' ? 'bg-gray-100 text-gray-500' :
                                                            r.classifiedProductName === '(DB 없음)' ? 'bg-red-100 text-red-500' :
                                                                'bg-green-100 text-green-700'
                                            )}>
                                                {r.classifiedProductName}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-gray-700 text-xs">
                                            {r.dbGroup?.mergedOption || r.excelRow?.productName || '-'}
                                        </td>
                                        <td className="px-3 py-3 text-center text-gray-700">
                                            {r.dbGroup ? `${r.dbGroup.adultCount}+${r.dbGroup.childCount}` : r.excelRow?.pax ?? '-'}
                                        </td>
                                        <td className="px-3 py-3 text-right tabular-nums">{r.actualAmount > 0 ? r.actualAmount.toLocaleString() : '-'}</td>
                                        <td className="px-3 py-3 text-right tabular-nums">{r.expectedAmount > 0 ? r.expectedAmount.toLocaleString() : '-'}</td>
                                        <td className={cn('px-3 py-3 text-right tabular-nums font-semibold',
                                            r.amountDiff > 0 ? 'text-red-600' : r.amountDiff < 0 ? 'text-blue-600' : 'text-gray-400'
                                        )}>
                                            {r.amountDiff !== 0 ? `${r.amountDiff > 0 ? '+' : ''}${r.amountDiff.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-500 max-w-[180px] truncate">{r.notes.join(', ') || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && parsedRows.length === 0 && matchResults.length === 0 && parseErrors.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">엑셀 파일을 업로드하여 정산 검토를 시작하세요</p>
                    <p className="text-sm mt-1">{platform.label} 플랫폼의 정산 내역 파일을 위 영역에 드래그하거나 클릭하세요</p>
                </div>
            )}

            {/* Product Settings Modal */}
            {showSettings && <ProductSettingsModal onClose={() => setShowSettings(false)} />}

            {/* Detail Comparison Popup */}
            {detailResult && <DetailPopup result={detailResult} onClose={() => setDetailResult(null)} />}
        </div>
    );
}

// ==================================================
// Summary Card
// ==================================================

function SummaryCard({ label, value, icon, bg }: { label: string; value: number; icon: React.ReactNode; bg: string }) {
    return (
        <div className={cn('rounded-xl border p-4 flex items-center gap-3', bg)}>
            {icon}
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}

// ==================================================
// Product Settings Modal (CRUD)
// ==================================================

function ProductSettingsModal({ onClose }: { onClose: () => void }) {
    const [products, setProducts] = useState<ProductPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newRow, setNewRow] = useState<Partial<ProductPrice> | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const { data } = await supabase.from('product_prices').select('*').order('tier_group');
        setProducts((data || []) as ProductPrice[]);
        setLoading(false);
    };

    const updateField = (id: string, field: keyof ProductPrice, value: unknown) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const saveProduct = async (p: ProductPrice) => {
        setSaving(true);
        const { error } = await supabase.from('product_prices').update({
            product_name: p.product_name,
            match_keywords: p.match_keywords,
            adult_price: p.adult_price,
            child_price: p.child_price,
            tier_group: p.tier_group,
            is_active: p.is_active,
        }).eq('id', p.id);

        if (error) alert(`저장 실패: ${error.message}`);
        setSaving(false);
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('이 상품을 삭제하시겠습니까?')) return;
        await supabase.from('product_prices').delete().eq('id', id);
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const toggleActive = async (p: ProductPrice) => {
        const newActive = !p.is_active;
        await supabase.from('product_prices').update({ is_active: newActive }).eq('id', p.id);
        updateField(p.id, 'is_active', newActive);
    };

    const addNewProduct = async () => {
        if (!newRow?.product_name) return;
        setSaving(true);
        const { data, error } = await supabase.from('product_prices').insert({
            product_name: newRow.product_name || '',
            match_keywords: newRow.match_keywords || '',
            adult_price: newRow.adult_price || 0,
            child_price: newRow.child_price || 0,
            tier_group: newRow.tier_group || 'Tier 1',
            is_active: true,
        }).select();

        if (error) {
            alert(`추가 실패: ${error.message}`);
        } else if (data) {
            setProducts(prev => [...prev, data[0] as ProductPrice]);
            setNewRow(null);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-bold text-gray-800">⚙️ 기준가 관리</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="text-gray-500">
                                <tr>
                                    <th className="text-left py-2 px-2">상품명</th>
                                    <th className="text-left py-2 px-2">키워드</th>
                                    <th className="text-right py-2 px-2">성인가</th>
                                    <th className="text-right py-2 px-2">아동가</th>
                                    <th className="text-center py-2 px-2">등급</th>
                                    <th className="text-center py-2 px-2">활성</th>
                                    <th className="text-center py-2 px-2">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {products.map(p => (
                                    <tr key={p.id} className={cn(!p.is_active && 'opacity-40')}>
                                        <td className="py-2 px-2">
                                            <input className="w-full border rounded px-2 py-1 text-sm" value={p.product_name} onChange={e => updateField(p.id, 'product_name', e.target.value)} />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input className="w-full border rounded px-2 py-1 text-sm" value={p.match_keywords} onChange={e => updateField(p.id, 'match_keywords', e.target.value)} />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" value={p.adult_price} onChange={e => updateField(p.id, 'adult_price', Number(e.target.value))} />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" value={p.child_price} onChange={e => updateField(p.id, 'child_price', Number(e.target.value))} />
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <select className="border rounded px-1 py-1 text-xs" value={p.tier_group} onChange={e => updateField(p.id, 'tier_group', e.target.value)}>
                                                <option>Tier 1</option>
                                                <option>Tier 2</option>
                                                <option>Tier 3</option>
                                            </select>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <button onClick={() => toggleActive(p)} className={cn('px-2 py-0.5 rounded text-xs font-medium', p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                                                {p.is_active ? 'ON' : 'OFF'}
                                            </button>
                                        </td>
                                        <td className="py-2 px-2 text-center flex gap-1 justify-center">
                                            <button onClick={() => saveProduct(p)} disabled={saving} className="p-1 hover:bg-blue-50 rounded" title="저장">
                                                <Save className="w-4 h-4 text-blue-600" />
                                            </button>
                                            <button onClick={() => deleteProduct(p.id)} className="p-1 hover:bg-red-50 rounded" title="삭제">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* New Row */}
                                {newRow && (
                                    <tr className="bg-blue-50/30">
                                        <td className="py-2 px-2">
                                            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="상품명" value={newRow.product_name || ''} onChange={e => setNewRow({ ...newRow, product_name: e.target.value })} />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="키워드 (쉼표)" value={newRow.match_keywords || ''} onChange={e => setNewRow({ ...newRow, match_keywords: e.target.value })} />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" placeholder="0" value={newRow.adult_price || ''} onChange={e => setNewRow({ ...newRow, adult_price: Number(e.target.value) })} />
                                        </td>
                                        <td className="py-2 px-2">
                                            <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" placeholder="0" value={newRow.child_price || ''} onChange={e => setNewRow({ ...newRow, child_price: Number(e.target.value) })} />
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <select className="border rounded px-1 py-1 text-xs" value={newRow.tier_group || 'Tier 1'} onChange={e => setNewRow({ ...newRow, tier_group: e.target.value })}>
                                                <option>Tier 1</option>
                                                <option>Tier 2</option>
                                                <option>Tier 3</option>
                                            </select>
                                        </td>
                                        <td className="py-2 px-2" />
                                        <td className="py-2 px-2 text-center">
                                            <button onClick={addNewProduct} disabled={saving} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                                                {saving ? '...' : '추가'}
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t flex justify-between">
                    <button
                        onClick={() => setNewRow(newRow ? null : { tier_group: 'Tier 1' })}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Plus className="w-4 h-4" /> {newRow ? '취소' : '상품 추가'}
                    </button>
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">닫기</button>
                </div>
            </div>
        </div>
    );
}

// ==================================================
// Detail Comparison Popup
// ==================================================

function DetailPopup({ result, onClose }: { result: MatchResult; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        {result.status === 'normal' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {result.status === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                        {result.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                        상세 비교 — {result.statusLabel}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[60vh] space-y-6">
                    {/* Excel Side */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">📄 엑셀 데이터</h3>
                        {result.excelRow ? (
                            <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-4 rounded-xl">
                                <div><span className="text-gray-400">예약번호</span><p className="font-mono">{result.excelRow.reservationId || '-'}</p></div>
                                <div><span className="text-gray-400">고객명</span><p>{result.excelRow.customerName || '-'}</p></div>
                                <div><span className="text-gray-400">날짜</span><p>{result.excelRow.tourDate || '-'}</p></div>
                                <div><span className="text-gray-400">상품명</span><p>{result.excelRow.productName || '-'}</p></div>
                                <div><span className="text-gray-400">인원</span><p>성인 {result.excelRow.adultCount} / 아동 {result.excelRow.childCount}</p></div>
                                <div><span className="text-gray-400">금액</span><p className="font-semibold">{result.excelRow.platformAmount.toLocaleString()}원</p></div>
                            </div>
                        ) : <p className="text-sm text-gray-400 italic">엑셀에 데이터 없음</p>}
                    </div>

                    {/* DB Side */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">🗃️ DB 데이터 (병합)</h3>
                        {result.dbGroup ? (
                            <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-4 rounded-xl">
                                <div><span className="text-gray-400">이름</span><p>{result.dbGroup.name}</p></div>
                                <div><span className="text-gray-400">접수일</span><p>{result.dbGroup.receiptDate}</p></div>
                                <div><span className="text-gray-400">투어일</span><p>{result.dbGroup.tourDate}</p></div>
                                <div><span className="text-gray-400">병합 옵션</span><p className="font-semibold">{result.dbGroup.mergedOption}</p></div>
                                <div className="col-span-2 bg-blue-50 rounded-lg p-2"><span className="text-blue-500 text-xs">🏷️ 판별된 상품</span><p className="font-bold text-blue-700">{result.classifiedProductName}</p></div>
                                <div><span className="text-gray-400">인원</span><p>성인 {result.dbGroup.adultCount} / 아동 {result.dbGroup.childCount} (총 {result.dbGroup.totalPax})</p></div>
                                <div><span className="text-gray-400">예약 IDs</span><p className="text-xs font-mono">{result.dbGroup.reservationIds.length}건</p></div>
                                <div><span className="text-gray-400">연락처</span><p>{result.dbGroup.contact || '-'}</p></div>
                                <div><span className="text-gray-400">메모</span><p>{result.dbGroup.note || '-'}</p></div>
                            </div>
                        ) : <p className="text-sm text-gray-400 italic">DB에 데이터 없음</p>}
                    </div>

                    {/* Amount Comparison */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">💰 금액 비교</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-xs text-gray-400">실제 금액</p>
                                <p className="text-lg font-bold">{result.actualAmount.toLocaleString()}원</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">예상 금액</p>
                                <p className="text-lg font-bold">{result.expectedAmount.toLocaleString()}원</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">차액</p>
                                <p className={cn('text-lg font-bold',
                                    result.amountDiff > 0 ? 'text-red-600' : result.amountDiff < 0 ? 'text-blue-600' : 'text-green-600'
                                )}>
                                    {result.amountDiff > 0 ? '+' : ''}{result.amountDiff.toLocaleString()}원
                                    <span className="text-xs font-normal ml-1">({result.diffPercent.toFixed(1)}%)</span>
                                </p>
                            </div>
                        </div>
                        {result.matchedProduct && (
                            <p className="text-xs text-gray-400 mt-3 text-center">
                                기준가: {result.matchedProduct.product_name} ({result.matchedProduct.tier_group})
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    {result.notes.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                            <h3 className="text-sm font-bold text-yellow-700 mb-1">📝 비고</h3>
                            <ul className="text-sm text-yellow-600 space-y-1">
                                {result.notes.map((n, i) => <li key={i}>• {n}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t text-right">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">닫기</button>
                </div>
            </div>
        </div>
    );
}
