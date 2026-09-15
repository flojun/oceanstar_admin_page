import {
    CATEGORY_LABEL,
    DATE_FIELD_LABEL,
    monthColumn,
    sortByMetric,
    totalsByPlatform,
    type CategoryFilter,
    type DateField,
    type Stats,
} from './dashboardStats.ts';

export interface ReportMeta {
    dateField: DateField;
    category: CategoryFilter;
}

/** 화면 차트와 같은 팔레트 (검증된 categorical 8슬롯, 순서 고정) */
export const SERIES_COLORS = [
    '2a78d6', 'eb6834', '1baf7a', 'eda100', 'e87ba4', '008300', '4a3aa7', 'e34948',
];

const FONT = 'Malgun Gothic';
const TITLE_COLOR = '0F172A';
const SUB_COLOR = '64748B';

const comma = (n: number) => n.toLocaleString('ko-KR');

/**
 * 달마다 한 장씩, 가로축은 플랫폼 이름 / 세로축은 값.
 * 한 장에 인원수(왼쪽)와 예약 건수(오른쪽)를 나란히 둬서 같은 달을 한눈에 비교한다.
 * 마지막에 전체 기간 상세표 2장(인원 / 건수).
 *
 * pptxgenjs 는 클릭했을 때만 동적으로 불러온다 — 초기 번들에 넣을 이유가 없다.
 */
export async function downloadReport(stats: Stats, meta: ReportMeta): Promise<void> {
    const { default: PptxGenJS } = await import('pptxgenjs');
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = '오션스타 예약 리포트';

    const from = stats.months[0];
    const to = stats.months[stats.months.length - 1];
    const basis = `${DATE_FIELD_LABEL[meta.dateField]} 기준  ·  ${CATEGORY_LABEL[meta.category]}`;

    const slide = (title: string, subtitle: string) => {
        const s = pptx.addSlide();
        s.addText(title, {
            x: 0.5, y: 0.28, w: 9, h: 0.45,
            fontSize: 24, bold: true, color: TITLE_COLOR, fontFace: FONT,
        });
        s.addText(subtitle, {
            x: 0.5, y: 0.74, w: 9, h: 0.28,
            fontSize: 11, color: SUB_COLOR, fontFace: FONT,
        });
        return s;
    };

    // ---- 달마다 한 장 (예약이 0건인 달은 빈 장이 되므로 건너뛴다) ----
    stats.months.forEach((month, i) => {
        const cells = monthColumn(stats, i);
        const monthPax = cells.reduce((a, c) => a + c.pax, 0);
        const monthCount = cells.reduce((a, c) => a + c.count, 0);
        if (monthCount === 0) return;

        const s = slide(
            `${month}  플랫폼별 비교`,
            `${basis}  ·  합계 ${comma(monthPax)}명 / ${comma(monthCount)}건`,
        );

        const chart = (metric: 'pax' | 'count', x: number, unit: string, name: string) => {
            // 값이 큰 것부터 자동 정렬 — 화면 차트와 같은 순서
            const bars = sortByMetric(cells, metric);
            s.addText(`${name} (${unit})`, {
                x, y: 1.1, w: 4.3, h: 0.3,
                fontSize: 12, bold: true, color: TITLE_COLOR, fontFace: FONT,
            });
            s.addChart(
                pptx.ChartType.bar,
                // 계열 1개 + chartColors 여러 개 => pptxgenjs 가 막대마다 다른 색을 칠한다.
                // 덕분에 가로축에 플랫폼 이름이 그대로 남는다 (범례로 밀려나지 않는다).
                [{ name, labels: bars.map(c => c.platform), values: bars.map(c => c[metric]) }],
                {
                    x, y: 1.45, w: 4.3, h: 3.8,
                    barDir: 'col',
                    barGrouping: 'clustered',
                    // 막대는 값 순으로 재배열되므로 색도 같이 따라간다 (색 = 플랫폼 고유)
                    chartColors: bars.map(c => SERIES_COLORS[stats.platforms.indexOf(c.platform) % SERIES_COLORS.length]),
                    showLegend: false,
                    showValue: true,
                    dataLabelFontFace: FONT,
                    dataLabelFontSize: 9,
                    dataLabelColor: TITLE_COLOR,
                    dataLabelPosition: 'outEnd',
                    catAxisLabelFontFace: FONT,
                    catAxisLabelFontSize: 9,
                    catAxisLabelRotate: -35,
                    valAxisLabelFontFace: FONT,
                    valAxisLabelFontSize: 9,
                },
            );
        };

        chart('pax', 0.5, '명', '탑승 인원');
        chart('count', 5.2, '건', '예약 건수');
    });

    // ---- 전체 기간 상세표 ----
    for (const metric of ['pax', 'count'] as const) {
        const unit = metric === 'pax' ? '명' : '건';
        const name = metric === 'pax' ? '탑승 인원' : '예약 건수';
        const totals = totalsByPlatform(stats, metric);
        const monthHeader = meta.dateField === 'tour_date' ? '여행월' : '접수월';

        const header = [
            { text: monthHeader, options: { bold: true } },
            ...stats.platforms.map(p => ({ text: p, options: { bold: true, align: 'right' as const } })),
            { text: '합계', options: { bold: true, align: 'right' as const } },
        ];
        const body = stats.months.map((m, i) => {
            const rowTotal = stats.platforms.reduce((sum, p) => sum + stats[metric][p][i], 0);
            return [
                { text: m, options: {} },
                ...stats.platforms.map(p => ({
                    text: comma(stats[metric][p][i]),
                    options: { align: 'right' as const },
                })),
                { text: comma(rowTotal), options: { align: 'right' as const, bold: true } },
            ];
        });
        const footer = [
            { text: '합계', options: { bold: true } },
            ...stats.platforms.map(p => ({
                text: comma(totals[p]),
                options: { align: 'right' as const, bold: true },
            })),
            {
                text: comma(metric === 'pax' ? stats.totalPax : stats.totalCount),
                options: { align: 'right' as const, bold: true },
            },
        ];

        slide(`월별 ${name} 상세 데이터`, `${from} ~ ${to}  ·  ${basis}  ·  단위 ${unit}`)
            .addTable([header, ...body, footer], {
                x: 0.5, y: 1.15, w: 9,
                fontSize: stats.months.length > 12 ? 8 : 10,
                fontFace: FONT,
                color: TITLE_COLOR,
                border: { type: 'solid', pt: 0.5, color: 'E2E8F0' },
                fill: { color: 'FFFFFF' },
                autoPage: false,
            });
    }

    const stamp = (s: string) => s.replace('-', '');
    await pptx.writeFile({
        fileName: `오션스타_예약리포트_${stamp(from)}-${stamp(to)}_${DATE_FIELD_LABEL[meta.dateField]}_${CATEGORY_LABEL[meta.category]}.pptx`,
    });
}
