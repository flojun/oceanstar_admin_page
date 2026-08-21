# Discord 긴급 예약 알림 + 마이리얼트립 이메일 자동 수집 — 설정 가이드

이 가이드는 오션스타 관리 시스템의 **Discord 긴급 알림**과 **마이리얼트립 이메일 자동 수집** 기능을 설정하는 방법을 안내합니다.

---

## 1단계: Discord 서버 설정

### 1-1. 긴급 예약 전용 채널 생성
1. Discord 서버에서 `+` 버튼을 눌러 새 채널을 생성합니다.
2. 채널 이름: `#긴급-예약`
3. 카테고리: 원하는 카테고리에 배치

### 1-2. 역할 생성
1. **서버 설정** → **역할** → **역할 만들기**
2. 역할 이름: `@긴급예약`
3. 색상: 빨간색 권장
4. 이 역할을 알림을 받아야 할 관리자들에게 부여합니다.
5. 역할 ID 복사 방법:
   - Discord 설정 → 고급 → **개발자 모드** 활성화
   - 역할을 우클릭 → **ID 복사** → 이 값이 `DISCORD_URGENT_ROLE_ID`입니다.

### 1-3. Webhook URL 생성
1. `#긴급-예약` 채널 설정 → **연동** → **웹후크** → **새 웹후크**
2. 이름: `오션스타 긴급 알림`
3. **웹후크 URL 복사** → 이 값이 `DISCORD_WEBHOOK_URL`입니다.

### 1-4. 관리자 폰 알림 설정
각 관리자가 Discord 앱(iOS/Android)에서:
1. `#긴급-예약` 채널 길게 누름 → **알림 설정**
2. **모든 메시지** 선택
3. Discord 앱 자체 알림이 켜져 있는지 확인

---

## 2단계: 환경변수 설정

### 로컬 개발 환경 (`.env.local`)
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/XXXXXXXXX/YYYYYYYYY
DISCORD_URGENT_ROLE_ID=123456789012345678
DB_WEBHOOK_SECRET=your-random-secret-string-here
```

### Vercel 배포 환경
1. Vercel Dashboard → 프로젝트 → **Settings** → **Environment Variables**
2. 위 3개 변수를 동일하게 추가
3. **Redeploy** 실행

---

## 3단계: Supabase SQL 실행

Supabase Dashboard → **SQL Editor**에서 다음 쿼리를 실행합니다:

```sql
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS urgent_alert_sent boolean DEFAULT false;
```

이 컬럼은 Discord 알림 중복 발송을 방지하는 플래그입니다.

---

## 4단계: Supabase Database Webhook 설정 (Track 1)

자체 DB 예약(홈페이지/여행사/수동 입력)에 대한 실시간 알림을 위해:

1. Supabase Dashboard → **Database** → **Webhooks**
2. **Create a new webhook** 클릭
3. 설정:
   - **Name**: `urgent-reservation-alert`
   - **Table**: `reservations`
   - **Events**: `INSERT`, `UPDATE` 체크
   - **URL**: `https://your-domain.vercel.app/api/notifications/discord-urgent-reservation`
   - **HTTP Headers**: 
     - Key: `x-webhook-secret`
     - Value: `.env`의 `DB_WEBHOOK_SECRET`과 동일한 값

---

## 5단계: Gmail IMAP 설정 확인

마이리얼트립 이메일 자동 수집을 위해 Gmail IMAP이 활성화되어 있어야 합니다:

1. Gmail 웹 → **설정** (⚙️) → **모든 설정 보기**
2. **전달 및 POP/IMAP** 탭
3. **IMAP 사용** 활성화
4. 저장

> **참고**: `NODEMAILER_EMAIL`과 `NODEMAILER_PW`(Gmail 앱 비밀번호)는 이미 설정되어 있으므로 추가 작업이 필요 없습니다.

---

## 6단계: Vercel Cron 확인

`vercel.json`에 5분마다 이메일을 체크하는 Cron Job이 설정되어 있습니다:

```json
{
  "path": "/api/cron/check-myrealtrip-emails",
  "schedule": "*/5 * * * *"
}
```

> **주의**: `*/5 * * * *` (5분 주기)는 **Vercel Pro 플랜** 이상에서만 지원됩니다.
> Hobby 플랜을 사용 중이라면 외부 Cron 서비스 (예: [cron-job.org](https://cron-job.org))를 사용하세요:
> - URL: `https://your-domain.vercel.app/api/cron/check-myrealtrip-emails`
> - Method: `GET`
> - Header: `Authorization: Bearer YOUR_CRON_SECRET`
> - 주기: 5분

---

## 수동 테스트 방법

### 마이리얼트립 이메일 Cron 테스트
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/check-myrealtrip-emails
```

### Discord Webhook 직접 테스트
```bash
curl -X POST https://your-domain.vercel.app/api/notifications/discord-urgent-reservation \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_DB_WEBHOOK_SECRET" \
  -d '{
    "type": "INSERT",
    "record": {
      "id": "test-id",
      "name": "테스트 고객",
      "tour_date": "2026-08-06",
      "option": "1부",
      "status": "예약확정",
      "source": "웹사이트",
      "order_id": "TEST01",
      "pax": "2명",
      "urgent_alert_sent": false
    },
    "old_record": null
  }'
```

---

## 동작 요약

| 예약 경로 | 흐름 | Discord 알림 조건 |
|-----------|------|-------------------|
| 자체 웹사이트 | 결제 → DB INSERT → Supabase Webhook → API | 당일/전날 투어 + 예약확정 |
| 여행사/수동 입력 | 관리자 등록 → DB INSERT → Supabase Webhook → API | 당일/전날 투어 + 예약확정 |
| 마이리얼트립 | 이메일 → Cron IMAP → DB INSERT/UPDATE | 당일/전날 투어 (확정대기/확정완료 모두) |
