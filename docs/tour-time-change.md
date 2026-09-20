# 대표 시간을 픽업 포함으로 바꿀 때 손댈 곳

대표(고객용) 시간을 **1부 07:30-11:30 / 2부 10:30-14:30** 으로 통일했다.
순수 투어시간(1부 08:00-11:00 / 2부 11:00-14:00)은 상세페이지로 간다.

## 1. 코드 - 완료

| 파일 | 바뀐 값 |
|---|---|
| `src/locales/ko.ts` `tour.features.time_1/2` | `1부 07:30 - 11:30 (픽업 포함)` / `2부 10:30 - 14:30 (픽업 포함)` |
| `src/locales/en.ts` 같은 키 | `Session 1: 07:30 - 11:30 (incl. pickup)` 외 |
| `ReservationClientPage.tsx` 콤보 시간 선택 라벨 | `1부 (픽업 07:30)` / `2부 (픽업 10:30)` |

`FAQSection.tsx` 는 이미 07:30-11:30 / 10:30-14:30 이라 손대지 않았다.

## 2. DB - 손대지 않았다. 아래를 먼저 읽을 것

`tour_settings.start_time / end_time` 은 **고객용 표기가 아니라 출항 시각**이다.
morning1 = 08:00, sunset = 15:00 처럼 들어 있다.

morning1 을 07:30 으로 바꾸면 **선셋 픽업 시각이 30분 밀린다.**
`src/app/api/pickup/route.ts` 가 이렇게 계산하기 때문이다.

```
tour3Offset = sunset.start_time - morning1.start_time   // 지금 7시간
time_3      = 픽업장소.time_1 + tour3Offset
```

morning1 만 30분 당기면 offset 이 7시간 30분이 되어, 모든 장소의 선셋
픽업 시각이 30분 늦게 계산된다.

또 `src/lib/otaEmailParser.ts` 의 주석이 `tour_settings 출항 시각 08:00 /
11:00 / 15:00` 을 전제로 한다. 파싱 자체는 경계가 10시·14시라 07:30 이 와도
1부로 떨어지므로 깨지지 않지만, 필드의 뜻이 달라진다.

### 권하는 방향

start_time 은 **출항 시각 그대로 두고**, 고객에게 보이는 자리에서만
픽업 포함 시각을 쓴다. 픽업 시각은 이미
`pickup_locations.time_1 = '07:30'` 로 DB 에 따로 있다.

굳이 DB 를 바꾸겠다면 morning1 만 바꾸면 안 되고 셋을 같이 옮겨야
offset 이 유지된다.

```sql
-- 이 방향으로 갈 경우에만. 셋을 같이 옮긴다.
update tour_settings set start_time = '07:30', end_time = '11:30' where tour_id = 'morning1';
update tour_settings set start_time = '10:30', end_time = '14:30' where tour_id = 'morning2';
update tour_settings set start_time = '14:30'                     where tour_id = 'sunset';
```

바꾼 뒤에는 선셋 픽업 시각(`/api/pickup` 의 time_3)이 예전과 같은지
장소 몇 곳으로 확인할 것.

## 3. 이메일 - 시간이 들어 있지 않다

`src/lib/email.ts` -> `src/emails/VoucherEmail.tsx` 가 보내는 확정 메일에는
**시각이 한 줄도 없다.** 표에 들어가는 것은 예약번호 / 투어 날짜 / 투어 상품 /
예약 옵션(`1부` 같은 문자열) / 예약 인원 / 픽업 장소뿐이고, 시간은

> 자세한 픽업 시간 및 안내 사항은 첨부된 바우처 파일(PDF)을 반드시 확인해 주시기 바랍니다.

로 넘긴다.

즉 **고객이 메일에서 보는 시각은 첨부 PDF 안에 인쇄되어 있다.**
그 PDF 는 Supabase 스토리지 `vouchers` 버킷에 장소별·언어별로 올라가 있는
파일이고(`src/lib/voucherFiles.ts`), 코드에서 생성하지 않는다.

시간을 고치려면 그 PDF 들을 다시 만들어 같은 이름으로 올려야 한다.
이 저장소에서는 할 수 없다.
