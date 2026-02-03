"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Reservation, SOURCE_MAPPING } from '@/types/reservation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import * as XLSX from 'xlsx';
import { Loader2, Download, Filter } from 'lucide-react';

export default function DashboardStatsPage() {
    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

    // Trend Filter
    const [trendSource, setTrendSource] = useState<string>('ALL');

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            // Fetch all reservations
            // Note: In a production app with huge data, we should use server-side aggregation.
            // For now, client-side aggregation is fine.
            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .order('tour_date', { ascending: true });

            if (error) throw error;
            if (data) {
                setReservations(data as Reservation[]);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to parse pax (e.g. "3명" -> 3)
    const parsePax = (paxStr: string): number => {
        if (!paxStr) return 0;
        const num = parseInt(paxStr.replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // 1. Monthly Pax Stats (Overall)
    const monthlyPaxData = useMemo(() => {
        const stats: Record<string, number> = {};

        reservations.forEach(r => {
            if (!r.tour_date) return;
            // Expected format YYYY-MM-DD
            const date = new Date(r.tour_date);
            if (isNaN(date.getTime())) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const pax = parsePax(r.pax);

            stats[key] = (stats[key] || 0) + pax;
        });

        // Convert to array and sort
        return Object.entries(stats)
            .map(([date, pax]) => ({ date, pax }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [reservations]);

    // 2. Trend Data (Dynamic based on source)
    const trendData = useMemo(() => {
        const stats: Record<string, number> = {};

        reservations.forEach(r => {
            if (!r.tour_date) return;
            // Filter by source if selected
            if (trendSource !== 'ALL' && r.source !== trendSource) return;

            const date = new Date(r.tour_date);
            if (isNaN(date.getTime())) return;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const pax = parsePax(r.pax); // Tracking Pax Traffic

            stats[key] = (stats[key] || 0) + pax;
        });

        return Object.entries(stats)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [reservations, trendSource]);

    // 3. Invoice / Excel Export Logic
    const handleDownloadInvoice = () => {
        // Filter by selected Year/Month
        const targetPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

        const filtered = reservations.filter(r =>
            r.tour_date && r.tour_date.startsWith(targetPrefix)
        );

        if (filtered.length === 0) {
            alert('해당 월에 데이터가 없습니다.');
            return;
        }

        // Group by Source
        const grouped: Record<string, any[]> = {};
        filtered.forEach(r => {
            const src = r.source || 'Unknown';
            if (!grouped[src]) grouped[src] = [];
            grouped[src].push(r);
        });

        // Create Workbook
        const wb = XLSX.utils.book_new();

        // Create Sheet for each Source? Or one big sheet?
        // Usually Invoice is one sheet summarizing.
        // Let's create one sheet sorted by Source.

        const exportData: any[] = [];

        Object.entries(grouped).forEach(([src, rows]) => {
            // Source Header
            exportData.push({ 'No': `[ ${src} ]`, '예약일': '', '예약자명': '', '인원': '', '옵션': '', '픽업': '' });

            let sourceTotal = 0;

            rows.sort((a, b) => (a.tour_date || '').localeCompare(b.tour_date || ''));

            rows.forEach((r, idx) => {
                const pax = parsePax(r.pax);
                sourceTotal += pax;

                exportData.push({
                    'No': idx + 1,
                    '예약일': r.tour_date,
                    '예약자명': r.name,
                    '인원': pax,
                    '옵션': r.option,
                    '픽업': r.pickup_location,
                    '비고': r.note
                });
            });

            // Source Summary
            exportData.push({ 'No': '소계', '예약일': '', '예약자명': '', '인원': sourceTotal, '옵션': '', '픽업': '' });
            exportData.push({}); // Empty row
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "인보이스");

        const fileName = `Invoice_${targetPrefix}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // Get Unique Sources for Filter
    const availableSources = useMemo(() => {
        const sources = new Set(reservations.map(r => r.source).filter(Boolean));
        return Array.from(sources).sort();
    }, [reservations]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
            <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Monthly Total Pax */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">월별 총 탑승 인원</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyPaxData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="pax" fill="#3b82f6" name="인원(명)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. Monthly Trends with Filter */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-800">월별 예약 추세 (인원)</h2>
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <select
                                        value={trendSource}
                                        onChange={(e) => setTrendSource(e.target.value)}
                                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="ALL">전체 경로</option>
                                        {availableSources.map(src => (
                                            <option key={src} value={src}>{src}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} name="인원(명)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Download Section */}
                    <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-600">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">인보이스 다운로드</h2>
                                <p className="text-gray-500">
                                    특정 월의 데이터를 경로별로 정리하여 엑셀 파일로 다운로드합니다.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="block rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                >
                                    {[2024, 2025, 2026, 2027].map(year => (
                                        <option key={year} value={year}>{year}년</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="block rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                        <option key={month} value={month}>{month}월</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleDownloadInvoice}
                                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    인보이스 (Excel)
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
