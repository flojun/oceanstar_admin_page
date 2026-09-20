# 대표 시간을 픽업 포함으로 (1부 07:30-11:30 / 2부 10:30-14:30)

운영 기준
- 픽업은 **출항 30분 전**, 드롭 완료는 **항구 복귀 30분 뒤**.
- 1부: 07:30 픽업 → 08:00 출항 → 11:00 복귀 → 11:30 드롭.
- 2부: 10:30 픽업 → 11:00 출항 → 14:00 복귀 → 14:30 드롭.
- 선셋(현재 시즌): 15:00 픽업 시작 → 15:30 출항 → 18:00 항구 복귀 → 18:30 드롭 완료.

순수 투어시간(08:00-11:00 / 11:00-14:00)은 상세페이지로 간다.

## `start_time` 은 상품마다 뜻이 다르다

이게 이 문서의 핵심이다. 같은 컬럼인데 값의 의미가 갈린다.

| 상품 | `tour_settings.start_time` | 뜻 |
|---|---|---|
| morning1 | `08:00` | **출항** 시각. 기준 픽업은 30분 전(07:30) |
| morning2 | `11:00` | **출항** 시각. 기준 픽업은 30분 전(10:30) |
| sunset | `15:00` | **기준 픽업** 시각. 출항은 30분 뒤(15:30) |

선셋만 다른 이유는 이 값이 바우처 PDF 세트를 고르는 키라서다.
`voucherFiles.START_TIME_TO_SET` 이 `15:00 -> '300'` 으로 묶고,
`'300'` 세트의 장소별 픽업 시각이 곧 PDF 파일명(`Prince_3_315.pdf`)이다.
세트 이름 `130 / 230 / 300 / 330` 은 출항이 아니라 **그 시즌의 기준 픽업 시각**이다.
대부분의 장소(녹색천막·HGI·WR)가 기준 시각에 그대로 타고,
항구에서 먼 카할라(-20분)·HP(-10분)는 일찍, 가까운 알라모아나·프린스·직접은 늦게 탄다.

## 고쳐진 버그: 선셋 픽업 시각이 30분 일렀다

`src/app/api/pickup/route.ts` 가 이렇게 계산하고 있었다.

```
offset = sunset.start_time - morning1.start_time   // 15:00 - 08:00 = 7:00
time_3 = 픽업장소.time_1 + offset                  // 07:30 + 7:00 = 14:30
```

왼쪽은 **픽업**, 오른쪽은 **출항**이라 뺄셈이 성립하지 않는다. 결과가 30분 일렀다.
게다가 이 값이 관리자 화면에서 넣은 `pickup_locations.time_3` 을 **덮어쓰고** 있었다.
녹색천막 기준으로 화면에는 2:30, 실제 픽업과 바우처 PDF 에는 3:00 이 찍혔다.

새 `time_3` 결정 순서:

1. 관리자가 `pickup_locations.time_3` 에 직접 넣은 값
2. 없으면 **바우처 PDF 와 같은 표**(`src/lib/sunsetPickup.ts`)에서 현재 세트로 조회
3. 그래도 없으면 오프셋 계산. 이때 오프셋은
   `sunset.start_time - (morning1.start_time - 30분)` 이다

2번 덕분에 시즌이 바뀌어 `sunset.start_time` 만 갈아끼워도
화면·성공 페이지·메일의 픽업 시각이 첨부 PDF 와 자동으로 같이 움직인다.

## DB(`tour_settings`) 는 그대로 둔다

`start_time / end_time` 은 **출항·복귀 시각**으로 두고 고객에게 보여 줄 때만 벌린다.
이유는 둘이다.

1. 순수 투어시간 08:00-11:00 을 상세페이지에 쓸 예정이라 그 값이 DB 에 남아야 한다.
2. 선셋 `start_time` 은 PDF 파일명과 묶여 있어 값을 옮기면 세트가 통째로 어긋난다
   (`'300' -> '230'`). PDF 는 건드리지 않기로 했다.

나중에 정말 옮기려면 `START_TIME_TO_SET` 을 별도 컬럼(예: `tour_settings.voucher_set`)으로
끊어낸 다음이라야 안전하다.

## 한 일

| 파일 | 내용 |
|---|---|
| `src/lib/sunsetPickup.ts` (신규) | 선셋 픽업표·세트 매핑·장소 키를 한곳으로. 바우처와 픽업 API 가 같이 쓴다 |
| `src/lib/voucherFiles.ts` | 위 모듈을 쓰도록 정리. `resolvePickupTime()` 추가. "출항 시각" 이라던 주석을 "기준 픽업 시각" 으로 정정 |
| `src/app/api/pickup/route.ts` | `time_3` 결정 순서를 위와 같이 교체. 관리자 입력값을 더 이상 덮어쓰지 않는다 |
| `src/components/booking/BookingSuccessClient.tsx` | 직접(Harbor) 3부용 하드코딩 `14:50` 폴백 제거 (실제 값은 3:20) |
| `src/emails/VoucherEmail.tsx` · `src/lib/email.ts` | 확정 메일에 **픽업 시각** 줄 추가. 구하지 못하면 그 줄만 빠진다 |
| `ko.ts` / `en.ts` | `voucherEmail.label_pickup_time` 추가 |
| `ko.ts` / `en.ts` `tour.features.time_1,time_2` | `1부 07:30 - 11:30 (픽업 포함)` / `2부 10:30 - 14:30 (픽업 포함)` |
| `ReservationClientPage.tsx` | `pickupStart()` / `dropEnd()` 로 카드·모달 시간 표기. 콤보 시간 선택은 `1부 (픽업 07:30)` / `2부 (픽업 10:30)` |

`FAQSection.tsx` 는 이미 07:30-11:30 / 10:30-14:30 이라 그대로 뒀다.
선셋은 `time_variable`("시즌별 시간 변동") 분기라 ±30분 계산을 타지 않는다.
프라이빗은 `is_flat_rate` 분기라 해당 없다.

### 손대지 않은 것

- **바우처 PDF** (Supabase `vouchers` 버킷)
- **`tour_settings` / `pickup_locations` 데이터** - 위 이유
