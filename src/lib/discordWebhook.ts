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

    const payload: Record<string, unknown> = {
        content: roleId ? `<@&${roleId}>` : undefined,
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
