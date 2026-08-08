/**
 * Slack Webhook으로 긴급 예약 알림을 발송하는 공용 함수
 * Track 1 (자체 DB Webhook)과 Track 2 (마이리얼트립 이메일 Cron) 모두 사용
 */

interface SlackAlertParams {
    title: string;           // "🚨 [확정대기] 긴급 예약!" 등
    customerName: string;
    tourDate: string;
    option: string;
    pax?: string;
    source: string;
    orderNumber?: string;
    pickupLocation?: string;
}

export async function sendSlackUrgentAlert(params: SlackAlertParams): Promise<boolean> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('[Slack] SLACK_WEBHOOK_URL이 설정되지 않았습니다.');
        return false;
    }

    const fields = [
        { type: 'mrkdwn', text: `*👤 고객명:*\n${params.customerName || '미확인'}` },
        { type: 'mrkdwn', text: `*📅 투어일:*\n${params.tourDate || '미확인'}` },
        { type: 'mrkdwn', text: `*🎯 옵션:*\n${params.option || '미확인'}` },
        { type: 'mrkdwn', text: `*📋 출처:*\n${params.source || '미확인'}` },
    ];

    if (params.pax) {
        fields.push({ type: 'mrkdwn', text: `*👥 인원:*\n${params.pax}` });
    }
    if (params.orderNumber) {
        fields.push({ type: 'mrkdwn', text: `*🔖 예약번호:*\n${params.orderNumber}` });
    }
    if (params.pickupLocation) {
        fields.push({ type: 'mrkdwn', text: `*📍 픽업장소:*\n${params.pickupLocation}` });
    }

    const payload = {
        text: params.title, // Fallback text
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: params.title,
                    emoji: true
                }
            },
            {
                type: 'section',
                fields: fields
            },
            {
                type: 'divider'
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: 'Ocean Star 긴급 예약 알림 시스템'
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`[Slack] Webhook 발송 실패: ${response.status} ${response.statusText}`);
            return false;
        }

        console.log(`[Slack] 긴급 알림 발송 성공: ${params.title}`);
        return true;
    } catch (error) {
        console.error('[Slack] Webhook 발송 중 오류:', error);
        return false;
    }
}
