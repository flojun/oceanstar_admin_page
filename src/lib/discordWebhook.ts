/**
 * Discord Webhook으로 긴급 예약 알림을 발송하는 공용 함수
 * Track 1 (자체 DB Webhook)과 Track 2 (마이리얼트립 이메일 Cron) 모두 사용
 */

interface DiscordAlertParams {
    title: string;           // "🚨 [확정대기] 긴급 예약!" 등
    customerName: string;
    tourDate: string;
    option: string;
    pax?: string;
    source: string;
    orderNumber?: string;
    pickupLocation?: string;
    detail?: string;         // "픽업 HGI → 녹색천막 / 인원 2명 → 3명" 처럼 무엇이 바뀌었는지
}

export async function sendDiscordUrgentAlert(params: DiscordAlertParams): Promise<boolean> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const roleId = process.env.DISCORD_URGENT_ROLE_ID;

    if (!webhookUrl) {
        console.error('[Discord] DISCORD_WEBHOOK_URL이 설정되지 않았습니다.');
        return false;
    }

    const fields = [
        { name: '👤 고객명', value: params.customerName || '미확인', inline: true },
        { name: '📅 투어일', value: params.tourDate || '미확인', inline: true },
        { name: '🎯 옵션', value: params.option || '미확인', inline: true },
        { name: '📋 출처', value: params.source || '미확인', inline: true },
    ];

    if (params.pax) {
        fields.push({ name: '👥 인원', value: params.pax, inline: true });
    }
    if (params.orderNumber) {
        fields.push({ name: '🔖 예약번호', value: params.orderNumber, inline: true });
    }
    if (params.pickupLocation) {
        fields.push({ name: '📍 픽업장소', value: params.pickupLocation, inline: true });
    }
    if (params.detail) {
        fields.push({ name: '📝 변경내용', value: params.detail, inline: false });
    }

    const payload: Record<string, unknown> = {
        content: (roleId ? `<@&${roleId}> ` : '') + `${params.title} - ${params.customerName} (${params.tourDate})`,
        embeds: [
            {
                title: params.title,
                color: 0xFF0000, // 빨간색
                fields,
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Ocean Star 긴급 예약 알림',
                },
            },
        ],
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`[Discord] Webhook 발송 실패: ${response.status} ${response.statusText}`);
            return false;
        }

        console.log(`[Discord] 긴급 알림 발송 성공: ${params.title}`);
        return true;
    } catch (error) {
        console.error('[Discord] Webhook 발송 중 오류:', error);
        return false;
    }
}

/**
 * 여러 줄짜리 점검 보고. 긴급 예약 알림처럼 칸이 정해진 내용이 아닐 때 쓴다.
 * 문제가 있을 때만 역할 멘션을 단다(매일 "이상 없음" 으로 사람을 부르지 않는다).
 */
export async function sendDiscordReport(params: {
    title: string;
    description: string;
    ok: boolean;
}): Promise<boolean> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const roleId = process.env.DISCORD_URGENT_ROLE_ID;
    if (!webhookUrl) {
        console.error('[Discord] DISCORD_WEBHOOK_URL이 설정되지 않았습니다.');
        return false;
    }

    // 임베드 설명은 4096자까지다. 넘치면 잘라서라도 보낸다(안 보내는 것보다 낫다).
    const description = params.description.length > 4000
        ? `${params.description.slice(0, 4000)}\n… (잘림)`
        : params.description;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: !params.ok && roleId ? `<@&${roleId}> ${params.title}` : params.title,
                embeds: [{
                    title: params.title,
                    description,
                    color: params.ok ? 0x2ECC71 : 0xFF0000,
                    timestamp: new Date().toISOString(),
                    footer: { text: 'Ocean Star 메일 형식 점검' },
                }],
            }),
        });
        if (!response.ok) {
            console.error(`[Discord] 보고 발송 실패: ${response.status} ${response.statusText}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error('[Discord] 보고 발송 중 오류:', error);
        return false;
    }
}
