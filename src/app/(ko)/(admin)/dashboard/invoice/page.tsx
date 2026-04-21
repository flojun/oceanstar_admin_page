"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Settings, Save, Trash2, Plus, Loader2, X, RefreshCw } from "lucide-react";
import ExcelJS from "exceljs";

interface InvoicePrice {
    source: string;
    price_regular_adult: number | null;
    price_regular_child: number | null;
    price_sunset_adult: number | null;
    price_sunset_child: number | null;
}

export default function InvoiceManager() {
    // UI states
    const [activeTab, setActiveTab] = useState<'generate' | 'settings'>('generate');

    // Settings States
    const [prices, setPrices] = useState<InvoicePrice[]>([]);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [savingPrices, setSavingPrices] = useState(false);

    // Filter States
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [period, setPeriod] = useState<"first_half" | "second_half">("first_half");
    const [selectedSource, setSelectedSource] = useState<string>("");

    // Data States
    const [reservations, setReservations] = useState<any[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);

    useEffect(() => {
        fetchPrices();
    }, []);

    const fetchPrices = async () => {
        setLoadingPrices(true);
        const res = await fetch('/api/admin/invoice-prices', { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            setPrices(data || []);
        }
        setLoadingPrices(false);
    };

    const handleSavePrices = async () => {
        const validPrices = prices.filter(p => p.source && p.source.trim() !== '');
        
        if (validPrices.length !== prices.length) {
            alert('여행사 명칭이 없는 빈 항목은 자동으로 제외되었습니다.');
            setPrices(validPrices);
        }

        setSavingPrices(true);
        const res = await fetch('/api/admin/invoice-prices', {
            method: 'POST',
            body: JSON.stringify(validPrices),
        });
        if (res.ok) {
            alert('저장되었습니다.');
            fetchPrices();
        } else {
            alert('저장 실패했습니다.');
        }
        setSavingPrices(false);
    };

    const addPriceRow = () => {
        setPrices([{ 
            source: "", 
            price_regular_adult: null, 
            price_regular_child: null, 
            price_sunset_adult: null, 
            price_sunset_child: null 
        }, ...prices]);
    };

    const updatePrice = (index: number, field: keyof InvoicePrice, value: string) => {
        const newPrices = [...prices];
        if (field === 'source') {
            newPrices[index][field] = value;
        } else {
            newPrices[index][field] = value === '' ? null : Number(value);
        }
        setPrices(newPrices);
    };

    const removePriceRow = (index: number) => {
        setPrices(prices.filter((_, i) => i !== index));
    };

    // --- Source Alias Mapping ---
    // DB에 "탐" 또는 "타미스"로 저장된 건 모두 "타미스"로 통합 조회
    // DB에 "팜" 또는 "팜투어"로 저장된 건 모두 "팜투어"로 통합 조회
    const SOURCE_ALIASES: Record<string, string[]> = {
        '타미스': ['타미스', '탐'],
        '팜투어': ['팜투어', '팜'],
    };

    const getSourceVariants = (source: string): string[] => {
        // 정방향: "타미스" 선택 → ["타미스", "탐"]
        if (SOURCE_ALIASES[source]) return SOURCE_ALIASES[source];
        // 역방향: "탐" 선택 → ["타미스", "탐"] (혹시 별칭으로 등록된 경우)
        for (const [canonical, aliases] of Object.entries(SOURCE_ALIASES)) {
            if (aliases.includes(source)) return aliases;
        }
        // 매칭 없으면 원본만
        return [source];
    };

    // --- Invoice Generation ---
    const fetchReservations = async () => {
        if (!selectedSource) {
            alert("조회할 판매처(에이전시/여행사)를 선택해주세요.");
            return;
        }
        setLoadingRecords(true);

        const startDate = `${year}-${String(month).padStart(2, '0')}-${period === 'first_half' ? '01' : '16'}`;
        
        let endDate = "";
        if (period === 'first_half') {
            endDate = `${year}-${String(month).padStart(2, '0')}-15`;
        } else {
            const lastDay = new Date(year, month, 0).getDate();
            endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
        }

        const sourceVariants = getSourceVariants(selectedSource);

        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .in('source', sourceVariants)
            .gte('tour_date', startDate)
            .lte('tour_date', endDate)
            .neq('status', '취소')
            .neq('status', '취소요청')
            .order('tour_date', { ascending: true });

        if (error) {
            alert(`조회 중 오류 발생: ${error.message}`);
        } else {
            setReservations(data || []);
        }

        setLoadingRecords(false);
    };

    const getPriceDetails = (source: string) => {
        return prices.find(p => p.source === source) || { 
            price_regular_adult: 0, 
            price_regular_child: 0, 
            price_sunset_adult: 0, 
            price_sunset_child: 0 
        };
    };

    const extractChildCount = (text: string): number => {
        if (!text) return 0;
        const regex = /(?:아|유|소|child|c|baby)(?:동)?\s*(\d+)/i;
        const match = text.match(regex);
        return match ? parseInt(match[1], 10) : 0;
    };

    const extractGuideName = (contact: string): string => {
        if (!contact) return '';
        const hasKorean = /[가-힣]/.test(contact);
        if (hasKorean) {
            // Strip out digits and hyphens/plus signs if they typed a mix, keeping just the Korean text/name
            return contact.replace(/[0-9\-+]/g, '').trim();
        }
        return '';
    };

    const exportToExcel = async () => {
        if (reservations.length === 0) {
            alert('다운로드할 데이터가 없습니다.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Invoice');

        // Styles
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } } as ExcelJS.Fill;
        const fontBold = { bold: true };
        const borderAll = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        } as Partial<ExcelJS.Borders>;
        const centerAlign = { vertical: 'middle', horizontal: 'center' } as Partial<ExcelJS.Alignment>;

        // 1. Title section
        sheet.mergeCells('A1:G1');
        const h1 = sheet.getCell('A1');
        h1.value = 'OCEANVIEW  ACTIVITY  LLC';
        h1.font = { size: 16, bold: true };
        h1.alignment = { vertical: 'middle', horizontal: 'left' };

        sheet.mergeCells('A2:G2');
        const h2 = sheet.getCell('A2');
        h2.value = 'www.oceanstarhawaii.com          email - isporex@gmail.com';
        h2.font = { size: 11 };
        h2.alignment = { vertical: 'middle', horizontal: 'left' };

        sheet.mergeCells('A3:G3');
        const h3 = sheet.getCell('A3');
        h3.value = '1942 SAINT LOUIS DR. HONOLULU HAWAII 96816';
        h3.font = { size: 11 };
        h3.alignment = { vertical: 'middle', horizontal: 'left' };

        sheet.mergeCells('A4:G4');
        const h4 = sheet.getCell('A4');
        h4.value = 'TEL (808) 453-0840';
        h4.font = { size: 11 };
        h4.alignment = { vertical: 'middle', horizontal: 'left' };

        sheet.mergeCells('A6:G6');
        const toCell = sheet.getCell('A6');
        toCell.value = `TO: ${selectedSource}`;
        toCell.font = { size: 12, bold: true };
        toCell.alignment = { vertical: 'middle', horizontal: 'left' };

        // 2. Table Headers
        const cols = ['날짜', '가이드', '종목', '이 름', '인원', '요금', '합계'];
        const headerRowIndex = 7;
        const headerRow = sheet.getRow(headerRowIndex);
        cols.forEach((col, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = col;
            cell.font = fontBold;
            cell.alignment = centerAlign;
            // The google sheet doesn't seem to have border or fill, but keeping a simple one or leaving it clean.
            // Let's keep borders to match a clean invoice look if they are ok, or remove them. 
            // "처음부터 끝까지 똑같이 해줘" means no background fill on headers?
            // Google sheet headers often have no fill unless specified. Let's remove headerFill.
            // Actually, in the CSV we can't see fills. I'll just keep the fontBold and centerAlign.
        });

        const p = getPriceDetails(selectedSource);

        // 3. Rows
        let currentRowIndex = 8;
        reservations.forEach(r => {
            // pax parsing
            const paxSafe = r.pax || "0";
            const paxNum = parseInt(paxSafe.replace(/[^0-9]/g, ''), 10) || 0;
            const fullNote = `${r.note || ''} ${r.pickup_location || ''}`.toLowerCase();
            const childNum = Math.max(0, parseInt(r.child_count || "0", 10) || extractChildCount(fullNote));
            const adultNum = Math.max(0, paxNum - childNum);

            let isSunset = false;
            let baseTourName = '거북이 스노클링'; 
            if(r.option?.toLowerCase().includes('sunset') || r.option?.includes('선셋') || r.option?.includes('3부')) {
                isSunset = true;
                baseTourName = '선셋 스노클링';
            }
            if(r.option?.includes('프라이빗')) {
                baseTourName = '프라이빗 보트';
            }

            const adultPrice = isSunset ? (p.price_sunset_adult || 0) : (p.price_regular_adult || 0);
            const childPrice = isSunset ? (p.price_sunset_child || 0) : (p.price_regular_child || 0);

            const guideName = extractGuideName(r.contact);

            // Add Adult Row (if adults exist, or if it's the only one by default)
            if (adultNum > 0 || (adultNum === 0 && childNum === 0)) {
                const row = sheet.getRow(currentRowIndex);
                row.getCell(1).value = r.tour_date;
                row.getCell(2).value = guideName;
                row.getCell(3).value = childNum > 0 ? `${baseTourName}(성인)` : baseTourName;
                row.getCell(4).value = r.name;
                row.getCell(5).value = adultNum > 0 ? adultNum : 1; 
                row.getCell(6).value = adultPrice;
                row.getCell(7).value = { formula: `E${currentRowIndex}*F${currentRowIndex}`, result: (adultNum > 0 ? adultNum : 1) * adultPrice };

                row.getCell(1).alignment = centerAlign;
                row.getCell(2).alignment = centerAlign;
                row.getCell(3).alignment = centerAlign;
                row.getCell(4).alignment = centerAlign;
                row.getCell(5).alignment = centerAlign;
                row.getCell(6).alignment = centerAlign;
                row.getCell(7).alignment = centerAlign;

                row.getCell(6).numFmt = '$#,##0';
                row.getCell(7).numFmt = '$#,##0';
                currentRowIndex++;
            }

            // Add Child Row (if child exist)
            if (childNum > 0) {
                const row = sheet.getRow(currentRowIndex);
                row.getCell(1).value = r.tour_date;
                row.getCell(2).value = guideName;
                row.getCell(3).value = `${baseTourName}(아동)`;
                row.getCell(4).value = r.name;
                row.getCell(5).value = childNum;
                row.getCell(6).value = childPrice; 
                row.getCell(7).value = { formula: `E${currentRowIndex}*F${currentRowIndex}`, result: childNum * childPrice };

                row.getCell(1).alignment = centerAlign;
                row.getCell(2).alignment = centerAlign;
                row.getCell(3).alignment = centerAlign;
                row.getCell(4).alignment = centerAlign;
                row.getCell(5).alignment = centerAlign;
                row.getCell(6).alignment = centerAlign;
                row.getCell(7).alignment = centerAlign;

                row.getCell(6).numFmt = '$#,##0';
                row.getCell(7).numFmt = '$#,##0';
                currentRowIndex++;
            }
        });

        // 4. Total Footer
        currentRowIndex++; // Add an empty line before total if we want to roughly match the spacing.
        const totalRowIndex = currentRowIndex;
        const totalLabel = sheet.getCell(`F${totalRowIndex}`);
        totalLabel.value = 'TOTAL';
        totalLabel.font = fontBold;
        totalLabel.alignment = { vertical: 'middle', horizontal: 'right' };

        const sumCell = sheet.getCell(`G${totalRowIndex}`);
        sumCell.value = { formula: `SUM(G8:G${totalRowIndex - 1})`, result: 0 };
        sumCell.font = fontBold;
        sumCell.alignment = centerAlign;
        sumCell.numFmt = '$#,##0';

        // Adjust column widths
        sheet.columns.forEach((col, idx) => {
            col.width = [15, 12, 10, 15, 8, 12, 15][idx];
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const periodLabel = period === 'first_half' ? '상반기' : '하반기';
        a.download = `Invoice_${selectedSource}_${year}_${month}월_${periodLabel}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 w-full space-y-6 bg-white">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">인보이스 (Invoice) 관리</h1>
                    <p className="text-gray-500 mt-1">여행사별 성인/아동 예약 내역을 기반으로 정산 엑셀을 생성합니다.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button 
                    className={`px-4 py-2 font-bold text-sm ${activeTab === 'generate' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    onClick={() => setActiveTab('generate')}
                >
                    인보이스 생성 (미리보기)
                </button>
                <button 
                    className={`px-4 py-2 font-bold text-sm flex gap-1 items-center ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings className="w-4 h-4"/> 단가 관리 ($)
                </button>
            </div>

            {/* TAB: GENERATE */}
            {activeTab === 'generate' && (
                <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                        <div className="space-y-1 bg-white p-2 border border-gray-200 rounded-lg">
                            <label className="text-xs font-bold text-gray-600 ml-1">연/월</label>
                            <div className="flex items-center gap-1">
                                <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-24 border border-gray-300 rounded-md p-2 text-sm bg-gray-50 outline-none">
                                    {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}년</option>)}
                                </select>
                                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-20 border border-gray-300 rounded-md p-2 text-sm bg-gray-50 outline-none">
                                    {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{i+1}월</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-600">조회 항목</label>
                            <div className="flex gap-2">
                                <select value={period} onChange={e => setPeriod(e.target.value as any)} className="w-[160px] border border-gray-300 rounded-md p-2 text-sm bg-white outline-none">
                                    <option value="first_half">상반기 (1일 ~ 15일)</option>
                                    <option value="second_half">하반기 (16일 ~ 말일)</option>
                                </select>
                                <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)} className="w-[180px] border border-gray-300 rounded-md p-2 text-sm bg-white outline-none font-bold text-gray-800 shadow-sm border-blue-400">
                                    <option value="">판매처 선택...</option>
                                    {prices.map(p => (
                                        <option key={p.source} value={p.source}>{p.source}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button 
                            onClick={fetchReservations}
                            className="bg-blue-800 text-white font-bold text-sm px-6 py-2 rounded-lg hover:bg-blue-900 transition flex gap-2 items-center h-10 shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4"/> 예약 조회
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-white">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">미리보기</span>
                                {selectedSource ? `${selectedSource} - ${year}년 ${month}월 ${period === 'first_half' ? '상반기' : '하반기'}` : '판매처를 선택해주세요'}
                            </h3>
                            <button 
                                onClick={exportToExcel}
                                disabled={reservations.length === 0}
                                className="bg-emerald-600 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex gap-2 items-center disabled:opacity-50"
                            >
                                <Download className="w-4 h-4"/> 엑셀 다운로드 (.xlsx)
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr className="text-gray-500 font-semibold text-xs uppercase tracking-wider">
                                        <th className="p-3 text-center">날짜</th>
                                        <th className="p-3 text-center w-16">가이드</th>
                                        <th className="p-3 text-left">클래스/옵션 (성인, 아동 분리)</th>
                                        <th className="p-3 text-left">예약자명</th>
                                        <th className="p-3 text-center w-20">적용 인원</th>
                                        <th className="p-3 text-right">단가 (USD)</th>
                                        <th className="p-3 text-right">합계 (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingRecords ? (
                                        <tr><td colSpan={7} className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400"/></td></tr>
                                    ) : reservations.length === 0 ? (
                                        <tr><td colSpan={7} className="p-16 text-center text-gray-400 font-medium">조회된 예약이 없습니다.</td></tr>
                                    ) : (
                                        reservations.map((r, i) => {
                                            const p = getPriceDetails(selectedSource);
                                            const paxSafe = r.pax || "0";
                                            const paxNum = parseInt(paxSafe.replace(/[^0-9]/g, ''), 10) || 0;
                                            const fullNote = `${r.note || ''} ${r.pickup_location || ''}`.toLowerCase();
                                            const childNum = Math.max(0, parseInt(r.child_count || "0", 10) || extractChildCount(fullNote));
                                            const adultNum = Math.max(0, paxNum - childNum);

                                            let isSunset = false;
                                            let baseTourName = '거북이 스노클링';
                                            if(r.option?.toLowerCase().includes('sunset') || r.option?.includes('선셋') || r.option?.includes('3부')) {
                                                isSunset = true;
                                                baseTourName = '선셋 스노클링';
                                            }
                                            if(r.option?.includes('프라이빗')) {
                                                baseTourName = '프라이빗 보트';
                                            }

                                            const adultPrice = isSunset ? (p.price_sunset_adult || 0) : (p.price_regular_adult || 0);
                                            const childPrice = isSunset ? (p.price_sunset_child || 0) : (p.price_regular_child || 0);
                                            
                                            const guideName = extractGuideName(r.contact);
                                            
                                            // UI rendering
                                            const rows = [];
                                            
                                            if (adultNum > 0 || (adultNum === 0 && childNum === 0)) {
                                                const totalA = (adultNum > 0 ? adultNum : 1) * adultPrice;
                                                rows.push(
                                                    <tr key={`${r.id}-adult`} className="hover:bg-blue-50/50 transition">
                                                        <td className="p-3 text-center text-gray-600 whitespace-nowrap">{r.tour_date}</td>
                                                        <td className="p-3 text-center font-semibold text-gray-700 whitespace-nowrap">
                                                            {guideName ? <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{guideName}</span> : <div className="mx-auto w-8 h-4 border-b border-dashed border-gray-300"></div>}
                                                        </td>
                                                        <td className="p-3 font-medium text-gray-700">{baseTourName} <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">(성인)</span></td>
                                                        <td className="p-3 font-bold text-gray-900 whitespace-nowrap">{r.name}</td>
                                                        <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/30">{adultNum > 0 ? adultNum : 1}</td>
                                                        <td className="p-3 text-right text-gray-500">${adultPrice.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                                                        <td className="p-3 text-right font-bold text-blue-800 bg-blue-50/20">${totalA.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                                                    </tr>
                                                );
                                            }

                                            if (childNum > 0) {
                                                const totalC = childNum * childPrice;
                                                rows.push(
                                                    <tr key={`${r.id}-child`} className="hover:bg-orange-50/50 transition bg-gray-50/30">
                                                        <td className="p-3 text-center text-gray-400 whitespace-nowrap">{r.tour_date}</td>
                                                        <td className="p-3 text-center font-semibold text-gray-500 whitespace-nowrap">
                                                            {guideName ? <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs opacity-80">{guideName}</span> : <div className="mx-auto w-8 h-4 border-b border-dashed border-gray-300 opacity-50"></div>}
                                                        </td>
                                                        <td className="p-3 font-medium text-gray-600">{baseTourName} <span className="text-orange-500 font-bold bg-orange-50 px-1.5 rounded">(아동)</span></td>
                                                        <td className="p-3 font-medium text-gray-500 whitespace-nowrap">{r.name}</td>
                                                        <td className="p-3 text-center font-bold text-orange-600 bg-orange-50/50">{childNum}</td>
                                                        <td className="p-3 text-right text-gray-400">${childPrice.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                                                        <td className="p-3 text-right font-bold text-blue-800 bg-blue-50/20">${totalC.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                                                    </tr>
                                                );
                                            }
                                            
                                            return <React.Fragment key={r.id}>{rows}</React.Fragment>;
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="font-extrabold text-gray-800 text-xl tracking-tight">여행사 달러 단가 관리 ($)</h2>
                            <p className="text-sm text-gray-500 mt-1">1,2부 및 선셋 옵션에 대한 성인/아동 요금을 설정합니다.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={addPriceRow} className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition">
                                <Plus className="w-4 h-4"/> 여행사 추가
                            </button>
                            <button onClick={handleSavePrices} disabled={savingPrices} className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold px-5 py-2 rounded-lg flex items-center gap-2 transition shadow-sm disabled:opacity-50">
                                {savingPrices ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 단가 저장
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loadingPrices ? (
                            <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400"/></div>
                        ) : prices.length === 0 ? (
                            <div className="py-20 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">등록된 여행사 단가 정보가 없습니다.<br/><br/>우측 상단 여행사 추가 버튼을 클릭하세요.</div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                {prices.map((p, idx) => (
                                    <div key={idx} className="bg-white border-2 border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all rounded-2xl p-5 relative group">
                                        <button 
                                            onClick={() => removePriceRow(idx)}
                                            className="absolute -top-3 -right-3 p-2 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm z-10 hover:bg-red-500 hover:text-white"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>

                                        {/* Source Input */}
                                        <div className="mb-4">
                                            <input 
                                                value={p.source} 
                                                onChange={e => updatePrice(idx, 'source', e.target.value)} 
                                                placeholder="에이전시 / 판매처 명칭"
                                                className="w-full bg-transparent border-b-2 border-gray-200 pb-2 outline-none focus:border-blue-500 text-lg font-bold text-gray-800 placeholder-gray-300 transition"
                                            />
                                        </div>

                                        {/* Grid 2x2 */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Column 1: Regular */}
                                            <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 space-y-3">
                                                <div className="font-bold text-blue-800 text-sm text-center border-b border-blue-100 pb-2 mb-2">🐢 1,2부 거북이 스노클링</div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-bold text-gray-600 w-10">성인$</label>
                                                    <input 
                                                        type="number" value={p.price_regular_adult || ''} 
                                                        onChange={e => updatePrice(idx, 'price_regular_adult', e.target.value)} 
                                                        placeholder="0.00"
                                                        className="w-full border border-gray-200 rounded p-1.5 text-sm bg-white font-mono"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-bold text-gray-600 w-10">아동$</label>
                                                    <input 
                                                        type="number" value={p.price_regular_child || ''} 
                                                        onChange={e => updatePrice(idx, 'price_regular_child', e.target.value)} 
                                                        placeholder="0.00"
                                                        className="w-full border border-gray-200 rounded p-1.5 text-sm bg-white font-mono"
                                                    />
                                                </div>
                                            </div>

                                            {/* Column 2: Sunset */}
                                            <div className="bg-orange-50/30 p-3 rounded-xl border border-orange-100/50 space-y-3">
                                                <div className="font-bold text-orange-800 text-sm text-center border-b border-orange-100 pb-2 mb-2">🌅 3부 선셋 스노클링</div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-bold text-gray-600 w-10">성인$</label>
                                                    <input 
                                                        type="number" value={p.price_sunset_adult || ''} 
                                                        onChange={e => updatePrice(idx, 'price_sunset_adult', e.target.value)} 
                                                        placeholder="0.00"
                                                        className="w-full border border-gray-200 rounded p-1.5 text-sm bg-white font-mono"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-bold text-gray-600 w-10">아동$</label>
                                                    <input 
                                                        type="number" value={p.price_sunset_child || ''} 
                                                        onChange={e => updatePrice(idx, 'price_sunset_child', e.target.value)} 
                                                        placeholder="0.00"
                                                        className="w-full border border-gray-200 rounded p-1.5 text-sm bg-white font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
