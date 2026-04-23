"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Reservation, SOURCE_MAPPING } from '@/types/reservation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import * as XLSX from 'xlsx';
import { Loader2, Download, Filter, BarChart2, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import InvoicePage from '../invoice/page';

export default function DashboardStatsPage() {
    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState<Reservation[]>([]);

    // Chart Date Range Filter State
    // Default: 1 year range ending in current month
    // Example: Feb 2025 to Feb 2026
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const [startYear, setStartYear] = useState<number>(currentYear - 1);
    const [startMonth, setStartMonth] = useState<number>(currentMonth);
    const [endYear, setEndYear] = useState<number>(currentYear);
    const [endMonth, setEndMonth] = useState<number>(currentMonth);

    // Trend Filter
    const [trendSource, setTrendSource] = useState<string>('ALL');

    useEffect(() => {
        fetchReservations();
    }, [startYear, startMonth, endYear, endMonth]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            
            const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
            const lastDay = new Date(endYear, endMonth, 0).getDate();
            const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            let allData: Reservation[] = [];
            let hasMore = true;
            let page = 0;
            const limit = 1000;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('reservations')
                    .select('*')
                    .gte('tour_date', startDate)
                    .lte('tour_date', endDate)
                    .order('tour_date', { ascending: true })
                    .range(page * limit, (page + 1) * limit - 1);

                if (error) throw error;
                
                if (data && data.length > 0) {
                    allData = [...allData, ...(data as Reservation[])];
                    if (data.length < limit) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }
            }
            
            setReservations(allData);
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

    // Generate Month List for Range
    const getMonthRange = () => {
        const months = [];
        let curYear = startYear;
        let curMonth = startMonth;

        const endDateVal = endYear * 12 + endMonth;

        while (curYear * 12 + curMonth <= endDateVal) {
            months.push({ year: curYear, month: curMonth });
            curMonth++;
            if (curMonth > 12) {
                curMonth = 1;
                curYear++;
            }
        }
        return months;
    };

    // Helper format: 02/2026
    const formatMonthLabel = (year: number, month: number) => {
        return `${String(month).padStart(2, '0')}/${year}`;
    };

    // 1. Monthly Pax Stats (Overall)
    const monthlyPaxData = useMemo(() => {
        const stats: Record<string, number> = {};

        // Initialize with 0 for all months in range
        const months = getMonthRange();
        months.forEach(m => {
            const key = `${m.year}-${String(m.month).padStart(2, '0')}`; // Data Key
            stats[key] = 0;
        });

        reservations.forEach(r => {
            if (!r.tour_date) return;
            const date = new Date(r.tour_date);
            if (isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${year}-${String(month).padStart(2, '0')}`;

            // Only add if within our generated range keys
            if (stats.hasOwnProperty(key)) {
                const pax = parsePax(r.pax);
                stats[key] += pax;
            }
        });

        // Convert to array with Display Label
        return months.map(m => {
            const key = `${m.year}-${String(m.month).padStart(2, '0')}`;
            return {
                date: formatMonthLabel(m.year, m.month), // 02/2025
                pax: stats[key] || 0
            };
        });
    }, [reservations, startYear, startMonth, endYear, endMonth]);

    // 2. Trend Data (Dynamic based on source)
    const trendData = useMemo(() => {
        const stats: Record<string, number> = {};

        // Initialize with 0 for all months in range
        const months = getMonthRange();
        months.forEach(m => {
            const key = `${m.year}-${String(m.month).padStart(2, '0')}`; // Data Key
            stats[key] = 0;
        });

        reservations.forEach(r => {
            if (!r.tour_date) return;
            // Filter by source if selected
            if (trendSource !== 'ALL' && r.source !== trendSource) return;

            const date = new Date(r.tour_date);
            if (isNaN(date.getTime())) return;

            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${year}-${String(month).padStart(2, '0')}`;

            // Only add if within our generated range keys
            if (stats.hasOwnProperty(key)) {
                const pax = parsePax(r.pax);
                stats[key] += pax;
            }
        });

        return months.map(m => {
            const key = `${m.year}-${String(m.month).padStart(2, '0')}`;
            return {
                date: formatMonthLabel(m.year, m.month), // 02/2025
                count: stats[key] || 0
            };
        });
    }, [reservations, trendSource, startYear, startMonth, endYear, endMonth]);



    // Get Unique Sources for Filter
    const availableSources = useMemo(() => {
        const sources = new Set(reservations.map(r => r.source).filter(Boolean));
        return Array.from(sources).sort();
    }, [reservations]);

    return (
        <div className="flex flex-col gap-6 pb-20">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 p-1.5 rounded-xl">
                <Link
                    href="/dashboard/stats"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 bg-indigo-600 text-white shadow-md"
                >
                    <BarChart2 className="w-4 h-4" />
                    Overview
                </Link>
                <Link
                    href="/dashboard/settlement"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 text-gray-500 hover:text-gray-700 hover:bg-white/60"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    정산검토
                </Link>
            </div>

            <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    {/* Date Range Filter Controls */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-700">조회 기간:</span>

                            {/* Start Date */}
                            <div className="flex items-center gap-1">
                                <select
                                    value={startYear}
                                    onChange={(e) => setStartYear(Number(e.target.value))}
                                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}년</option>)}
                                </select>
                                <select
                                    value={startMonth}
                                    onChange={(e) => setStartMonth(Number(e.target.value))}
                                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
                                </select>
                            </div>

                            <span className="text-gray-400">~</span>

                            {/* End Date */}
                            <div className="flex items-center gap-1">
                                <select
                                    value={endYear}
                                    onChange={(e) => setEndYear(Number(e.target.value))}
                                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}년</option>)}
                                </select>
                                <select
                                    value={endMonth}
                                    onChange={(e) => setEndMonth(Number(e.target.value))}
                                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

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
                    <div className="bg-white rounded-xl shadow-lg border-t-4 border-blue-600 overflow-hidden mt-8">
                        <InvoicePage />
                    </div>
                </>
            )}
        </div>
    );
}
