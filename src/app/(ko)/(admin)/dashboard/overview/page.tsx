"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BarChart2, FileSpreadsheet, Loader2, Presentation } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { Reservation } from '@/types/reservation';
import {
    CATEGORY_LABEL, DATE_FIELD_LABEL, aggregate, monthColumn, monthLabel, monthRange,
    sortByMetric, toChartRows, totalsByPlatform,
    type CategoryFilter, type DateField, type PlatformCell,
} from '@/lib/dashboardStats';
import { SERIES_COLORS, downloadReport } from '@/lib/reportPptx';
import InvoicePage from '../invoice/page';

/**
 * 이 화면의 규칙
 * - 강조색 1개: indigo-600 (상단 탭과 동일)
 * - 모서리: 카드 rounded-xl / 컨트롤 rounded-lg / 세그먼트 rounded-md
 * - 계열색은 검증된 categorical 팔레트(SERIES_COLORS)를 순서대로 고정 배정 — 돌려쓰지 않는다
 */

const SURFACE = '#ffffff';
const GRID = '#eef1f5';
const AXIS_TEXT = '#64748b';

const color = (i: number) => `#${SERIES_COLORS[i % SERIES_COLORS.length]}`;
const comma = (n: number) => n.toLocaleString('ko-KR');
/** "2026-03" -> "26.03" (13개월까지 라벨이 겹치지 않는다) */
const tick = (m: string) => `${m.slice(2, 4)}.${m.slice(5)}`;

const YEARS = [2024, 2025, 2026, 2027, 2028];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DATE_FIELDS: DateField[] = ['tour_date', 'receipt_date'];
const CATEGORIES: CategoryFilter[] = ['all', 'online', 'ota', 'agency', 'direct'];

export default function DashboardOverviewPage() {
    const today = new Date();

    const [startYear, setStartYear] = useState(today.getFullYear() - 1);
    const [startMonth, setStartMonth] = useState(today.getMonth() + 1);
    const [endYear, setEndYear] = useState(today.getFullYear());
    const [endMonth, setEndMonth] = useState(today.getMonth() + 1);

    const [dateField, setDateField] = useState<DateField>('tour_date');
    const [category, setCategory] = useState<CategoryFilter>('all');
    const [tableMetric, setTableMetric] = useState<'pax' | 'count'>('pax');
    const [hidden, setHidden] = useState<Set<string>>(new Set());
    /** 맨 위 비교 차트에서 보고 있는 달. null 이면 기간의 마지막 달. */
    const [pickedMonth, setPickedMonth] = useState<string | null>(null);

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retry, setRetry] = useState(0);
    const [exporting, setExporting] = useState(false);

    const months = useMemo(
        () => monthRange({ year: startYear, month: startMonth }, { year: endYear, month: endMonth }),
        [startYear, startMonth, endYear, endMonth],
    );

    useEffect(() => {
        let cancelled = false;

        const fetchReservations = async () => {
            if (months.length === 0) { setReservations([]); setLoading(false); return; }
            setLoading(true);
            setLoadError(null);
            try {
                const first = months[0];
                const last = months[months.length - 1];
                const startDate = `${monthLabel(first)}-01`;
                const lastDay = new Date(last.year, last.month, 0).getDate();
                const endDate = `${monthLabel(last)}-${String(lastDay).padStart(2, '0')}`;

                const limit = 1000;
                const all: Reservation[] = [];
                for (let page = 0; ; page++) {
                    const { data, error } = await supabase
                        .from('reservations')
                        .select('*')
                        .neq('status', '취소')
                        .gte(dateField, startDate)
                        .lte(dateField, endDate)
                        .order(dateField, { ascending: true })
                        .range(page * limit, (page + 1) * limit - 1);

                    if (error) throw error;
                    if (!data?.length) break;
                    all.push(...(data as Reservation[]));
                    if (data.length < limit) break;
                }
                if (!cancelled) setReservations(all);
            } catch (e) {
                console.error('Error fetching stats:', e);
                if (!cancelled) {
                    setLoadError(e instanceof Error ? e.message : '예약 데이터를 불러오지 못했습니다.');
                    setReservations([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchReservations();
        return () => { cancelled = true; };
    }, [months, dateField, retry]);

    const stats = useMemo(
        () => aggregate(reservations, months, { dateField, category }),
        [reservations, months, dateField, category],
    );

    const paxRows = useMemo(() => toChartRows(stats, 'pax'), [stats]);
    const countRows = useMemo(() => toChartRows(stats, 'count'), [stats]);
    const tableTotals = useMemo(() => totalsByPlatform(stats, tableMetric), [stats, tableMetric]);
    const paxTotals = useMemo(() => totalsByPlatform(stats, 'pax'), [stats]);

    // 고른 달이 기간 밖이면 마지막 달로 되돌린다
    const activeMonth = pickedMonth && stats.months.includes(pickedMonth)
        ? pickedMonth
        : stats.months[stats.months.length - 1];
    const activeIndex = stats.months.indexOf(activeMonth);
    const cells: PlatformCell[] = useMemo(
        () => (activeIndex < 0 ? [] : monthColumn(stats, activeIndex)),
        [stats, activeIndex],
    );
    const monthPax = cells.reduce((a, c) => a + c.pax, 0);
    const monthCount = cells.reduce((a, c) => a + c.count, 0);

    const visible = stats.platforms.filter(p => !hidden.has(p));
    const topPlatform = stats.platforms[0];
    const avgPax = stats.totalCount ? stats.totalPax / stats.totalCount : 0;
    const isEmpty = !loading && !loadError && stats.totalCount === 0;

    const toggleSeries = (p: string) => setHidden(prev => {
        const next = new Set(prev);
        if (next.has(p)) next.delete(p); else next.add(p);
        return next;
    });

    const handleExport = async () => {
        setExporting(true);
        try {
            await downloadReport(stats, { dateField, category });
        } catch (e) {
            console.error('PPT 생성 실패:', e);
            alert('PPT 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 pb-20">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 p-1.5 rounded-xl">
                <Link
                    href="/dashboard/overview"
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

            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">대시보드</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {stats.months.length > 0
                            ? `${stats.months[0]} ~ ${stats.months[stats.months.length - 1]} · ${DATE_FIELD_LABEL[dateField]} 기준 · ${CATEGORY_LABEL[category]}`
                            : '조회 기간을 확인해 주세요'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={loading || exporting || isEmpty}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {exporting
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Presentation className="h-4 w-4" />}
                    {exporting ? 'PPT 생성 중' : 'PPT 다운로드'}
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <Segmented
                    label="집계 기준"
                    options={DATE_FIELDS.map(f => ({ value: f, label: DATE_FIELD_LABEL[f] }))}
                    value={dateField}
                    onChange={setDateField}
                />
                <Segmented
                    label="유입 경로"
                    options={CATEGORIES.map(c => ({ value: c, label: CATEGORY_LABEL[c] }))}
                    value={category}
                    onChange={setCategory}
                />
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">조회 기간</span>
                    <MonthPicker year={startYear} month={startMonth} onYear={setStartYear} onMonth={setStartMonth} />
                    <span className="text-slate-300">~</span>
                    <MonthPicker year={endYear} month={endMonth} onYear={setEndYear} onMonth={setEndMonth} />
                </div>
            </div>

            {loading ? (
                <Skeleton />
            ) : loadError ? (
                <Notice
                    title="데이터를 불러오지 못했습니다"
                    body={loadError}
                    action={<button type="button" onClick={() => setRetry(n => n + 1)} className="mt-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:translate-y-px">다시 시도</button>}
                />
            ) : isEmpty ? (
                <Notice
                    title="이 조건에 해당하는 예약이 없습니다"
                    body="조회 기간을 넓히거나 유입 경로를 '전체'로 바꿔 보세요. (취소 건과 테스트 데이터는 항상 제외됩니다)"
                />
            ) : (
                <>
                    {/* 1. 월별 플랫폼 비교 — 한 달을 골라 플랫폼끼리 나란히 */}
                    <section className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">월별 플랫폼 비교</h2>
                                <p className="mt-0.5 text-sm text-slate-400">
                                    가로축 플랫폼 · 세로축 인원/건수 · 합계 {comma(monthPax)}명 / {comma(monthCount)}건
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">비교할 달</span>
                                <MonthOfRangePicker
                                    months={stats.months}
                                    value={activeMonth}
                                    onChange={setPickedMonth}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <PlatformBars cells={cells} platforms={stats.platforms} metric="pax" title="탑승 인원" unit="명" />
                            <PlatformBars cells={cells} platforms={stats.platforms} metric="count" title="예약 건수" unit="건" />
                        </div>
                    </section>

                    {/* 2. 기간 전체 요약 */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Stat label="총 탑승 인원" value={comma(stats.totalPax)} unit="명" />
                        <Stat label="총 예약 건수" value={comma(stats.totalCount)} unit="건" />
                        <Stat label="건당 평균 인원" value={avgPax.toFixed(1)} unit="명" />
                        <Stat
                            label="최다 유입 경로"
                            value={topPlatform ?? '-'}
                            unit={topPlatform ? `${comma(paxTotals[topPlatform])}명` : ''}
                            small
                        />
                    </div>

                    {/* Legend (identity is never color-alone: 범례 + 상세 표) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">플랫폼</span>
                        {stats.platforms.map((p, i) => {
                            const off = hidden.has(p);
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => toggleSeries(p)}
                                    aria-pressed={!off}
                                    className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm transition ${off ? 'text-slate-400' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <span
                                        className="h-2.5 w-2.5 rounded-sm"
                                        style={{ backgroundColor: off ? '#cbd5e1' : color(i) }}
                                    />
                                    <span className={off ? 'line-through' : ''}>{p}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* 3. 기간 추세 */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <ChartCard title="월별 탑승 인원" subtitle="플랫폼별 누적">
                            <BarChart data={paxRows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                <CartesianGrid stroke={GRID} vertical={false} />
                                <XAxis dataKey="month" tickFormatter={tick} tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: AXIS_TEXT, fontSize: 12 }} minTickGap={4} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} width={52} />
                                <Tooltip content={<SeriesTooltip unit="명" />} cursor={{ fill: '#f8fafc' }} />
                                {visible.map(p => (
                                    <Bar
                                        key={p}
                                        dataKey={p}
                                        stackId="pax"
                                        fill={color(stats.platforms.indexOf(p))}
                                        stroke={SURFACE}
                                        strokeWidth={2}
                                        radius={p === visible[visible.length - 1] ? [4, 4, 0, 0] : undefined}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </BarChart>
                        </ChartCard>

                        <ChartCard title="월별 예약 건수" subtitle="플랫폼별 추세">
                            <LineChart data={countRows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                <CartesianGrid stroke={GRID} vertical={false} />
                                <XAxis dataKey="month" tickFormatter={tick} tickLine={false} axisLine={{ stroke: GRID }} tick={{ fill: AXIS_TEXT, fontSize: 12 }} minTickGap={4} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} width={52} />
                                <Tooltip content={<SeriesTooltip unit="건" />} cursor={{ stroke: '#cbd5e1' }} />
                                {visible.map(p => (
                                    <Line
                                        key={p}
                                        type="monotone"
                                        dataKey={p}
                                        stroke={color(stats.platforms.indexOf(p))}
                                        strokeWidth={2}
                                        dot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}
                                        activeDot={{ r: 6, strokeWidth: 2, stroke: SURFACE }}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </LineChart>
                        </ChartCard>
                    </div>

                    {/* 4. 상세 표 */}
                    <section className="rounded-xl border border-slate-200 bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <h2 className="text-base font-bold text-slate-900">
                                월별 플랫폼 상세 ({tableMetric === 'pax' ? '인원' : '건수'})
                            </h2>
                            <Segmented
                                options={[{ value: 'pax' as const, label: '인원' }, { value: 'count' as const, label: '건수' }]}
                                value={tableMetric}
                                onChange={setTableMetric}
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-sm tabular-nums">
                                <thead>
                                    <tr className="text-slate-500">
                                        <th className="sticky left-0 z-10 bg-white px-5 py-2.5 text-left font-semibold">
                                            {DATE_FIELD_LABEL[dateField].replace('일', '월')}
                                        </th>
                                        {stats.platforms.map((p, i) => (
                                            <th key={p} className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">
                                                <span className="mr-1.5 inline-block h-2 w-2 rounded-sm align-middle" style={{ backgroundColor: color(i) }} />
                                                {p}
                                            </th>
                                        ))}
                                        <th className="px-5 py-2.5 text-right font-semibold text-slate-900">합계</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.months.map((m, i) => {
                                        const rowTotal = stats.platforms.reduce((s, p) => s + stats[tableMetric][p][i], 0);
                                        const isActive = m === activeMonth;
                                        return (
                                            <tr key={m} className={`border-t border-slate-100 ${isActive ? 'bg-indigo-50/60' : ''}`}>
                                                <td className={`sticky left-0 z-10 px-5 py-2.5 ${isActive ? 'bg-indigo-50 font-semibold text-indigo-700' : 'bg-white text-slate-600'}`}>
                                                    {m}
                                                </td>
                                                {stats.platforms.map(p => {
                                                    const v = stats[tableMetric][p][i];
                                                    return (
                                                        <td key={p} className={`px-3 py-2.5 text-right ${v ? 'text-slate-700' : 'text-slate-300'}`}>
                                                            {comma(v)}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-5 py-2.5 text-right font-semibold text-slate-900">{comma(rowTotal)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-200 font-semibold text-slate-900">
                                        <td className="sticky left-0 z-10 bg-white px-5 py-3">합계</td>
                                        {stats.platforms.map(p => (
                                            <td key={p} className="px-3 py-3 text-right">{comma(tableTotals[p])}</td>
                                        ))}
                                        <td className="px-5 py-3 text-right">
                                            {comma(tableMetric === 'pax' ? stats.totalPax : stats.totalCount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </section>
                </>
            )}

            {/* Invoice Download Section */}
            <div className="bg-white rounded-xl shadow-lg border-t-4 border-blue-600 overflow-hidden mt-8">
                <InvoicePage />
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// 작은 조각들
// ---------------------------------------------------------------------------

/** 한 달치를 플랫폼끼리 나란히. 가로축 = 플랫폼, 세로축 = 값. */
function PlatformBars({ cells, platforms, metric, title, unit }: {
    cells: PlatformCell[];
    platforms: string[];
    metric: 'pax' | 'count';
    title: string;
    unit: string;
}) {
    // 값이 큰 것부터 자동 정렬 (색은 플랫폼에 묶여 있어 순서가 바뀌어도 그대로)
    const sorted = sortByMetric(cells, metric);

    return (
        <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
                {title} <span className="font-normal text-slate-400">({unit})</span>
            </p>
            <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sorted} margin={{ top: 24, right: 8, left: -16, bottom: 16 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis
                            dataKey="platform"
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                            height={104}
                            tickMargin={10}
                            tickLine={false}
                            axisLine={{ stroke: GRID }}
                            tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
                        />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} width={52} />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            formatter={(v) => [`${comma(Number(v) || 0)}${unit}`, title]}
                        />
                        <Bar dataKey={metric} radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={64}>
                            {sorted.map((c, i) => (
                                <Cell key={c.platform} fill={color(platforms.indexOf(c.platform) < 0 ? i : platforms.indexOf(c.platform))} />
                            ))}
                            <LabelList
                                dataKey={metric}
                                position="top"
                                formatter={(v) => (Number(v) ? comma(Number(v)) : '')}
                                style={{ fill: '#334155', fontSize: 11 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

/** 조회 기간 안에 실제로 있는 달만 연/월로 나눠 고른다 — 범위 밖을 고를 수 없다. */
function MonthOfRangePicker({ months, value, onChange }: {
    months: string[];
    value: string | undefined;
    onChange: (m: string) => void;
}) {
    const [year, month] = (value ?? '-').split('-');
    const years = Array.from(new Set(months.map(m => m.slice(0, 4))));
    const monthsOfYear = months.filter(m => m.startsWith(`${year}-`)).map(m => m.slice(5));

    const pickYear = (y: string) => {
        const sameMonth = `${y}-${month}`;
        onChange(months.includes(sameMonth) ? sameMonth : months.find(m => m.startsWith(`${y}-`))!);
    };

    return (
        <div className="flex items-center gap-1">
            <select aria-label="비교할 연도" value={year} onChange={e => pickYear(e.target.value)} className={SELECT_CLASS}>
                {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select aria-label="비교할 월" value={month} onChange={e => onChange(`${year}-${e.target.value}`)} className={SELECT_CLASS}>
                {monthsOfYear.map(m => <option key={m} value={m}>{Number(m)}월</option>)}
            </select>
        </div>
    );
}

function Segmented<T extends string>({ label, options, value, onChange }: {
    label?: string;
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                {options.map(o => (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        aria-pressed={value === o.value}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${value === o.value
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

const SELECT_CLASS = 'rounded-lg border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-sm text-slate-700 focus:border-indigo-500 focus:ring-indigo-500';

function MonthPicker({ year, month, onYear, onMonth }: {
    year: number; month: number; onYear: (v: number) => void; onMonth: (v: number) => void;
}) {
    return (
        <div className="flex items-center gap-1">
            <select aria-label="연도" value={year} onChange={e => onYear(Number(e.target.value))} className={SELECT_CLASS}>
                {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select aria-label="월" value={month} onChange={e => onMonth(Number(e.target.value))} className={SELECT_CLASS}>
                {MONTHS.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
        </div>
    );
}

function Stat({ label, value, unit, small }: { label: string; value: string; unit?: string; small?: boolean }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 flex items-baseline gap-1.5">
                <span className={`font-bold text-slate-900 ${small ? 'text-xl' : 'text-3xl'}`}>{value}</span>
                {unit && <span className="text-sm text-slate-500">{unit}</span>}
            </p>
        </div>
    );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactElement }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-baseline gap-2">
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <span className="text-sm text-slate-400">{subtitle}</span>
            </div>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
            </div>
        </section>
    );
}

interface TooltipEntry { name?: string | number; value?: number | string; color?: string }

function SeriesTooltip({ active, payload, label, unit }: {
    active?: boolean; payload?: TooltipEntry[]; label?: string; unit: string;
}) {
    if (!active || !payload?.length) return null;
    const rows = payload
        .filter(p => Number(p.value) > 0)
        .sort((a, b) => Number(b.value) - Number(a.value));
    const total = rows.reduce((s, p) => s + Number(p.value), 0);

    return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
            <p className="mb-1.5 font-semibold text-slate-900">{label}</p>
            {rows.length === 0 ? (
                <p className="text-slate-400">데이터 없음</p>
            ) : (
                <>
                    {rows.map(p => (
                        <p key={String(p.name)} className="flex items-center justify-between gap-4 text-slate-600">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
                                {p.name}
                            </span>
                            <span className="tabular-nums">{comma(Number(p.value))}{unit}</span>
                        </p>
                    ))}
                    <p className="mt-1.5 flex items-center justify-between gap-4 border-t border-slate-100 pt-1.5 font-semibold text-slate-900">
                        <span>합계</span>
                        <span className="tabular-nums">{comma(total)}{unit}</span>
                    </p>
                </>
            )}
        </div>
    );
}

function Skeleton() {
    return (
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="불러오는 중">
            <div className="h-[400px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="h-[92px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
                ))}
            </div>
            <div className="h-12 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {[0, 1].map(i => (
                    <div key={i} className="h-[404px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
                ))}
            </div>
        </div>
    );
}

function Notice({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <BarChart2 className="h-6 w-6 text-slate-300" />
            <p className="text-base font-semibold text-slate-800">{title}</p>
            <p className="max-w-md text-sm text-slate-500">{body}</p>
            {action}
        </div>
    );
}
