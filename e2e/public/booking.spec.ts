import { expect, test } from "@playwright/test";
import { checkout, chooseTour, fillBooker, interceptCheckout, L, openBooking, pickFirstAvailableDate, pickPlainTour, setPax, type Lang } from "../support/customer";
import { installGuard } from "../support/guard";

/**
 * 예약 → 결제 계약 테스트.
 * 화면이 어떻게 바뀌든 "결제 버튼이 Stripe 결제 API 를 이 모양으로 부른다"는 계약은 같아야 한다.
 * /api/stripe/checkout 은 가로채므로 실제 결제·Stripe 세션은 생기지 않는다.
 */
for (const lang of ["ko", "en"] as Lang[]) {
    test(`예약 흐름 → Stripe 결제 요청 계약 (${lang})`, async ({ page }, info) => {
        test.skip(info.project.name.includes("mobile") && lang === "en", "모바일은 KO 한 번만");
        const guard = await installGuard(page);
        const captured = await interceptCheckout(page);
        const tour = await pickPlainTour(page);

        const root = await openBooking(page, lang);
        await chooseTour(root, tour, lang);
        await setPax(root, 2, 0);
        await pickFirstAvailableDate(page, root);
        await fillBooker(root);
        await checkout(page, root, lang, lang === "ko" ? "KRW" : "USD");

        await expect(page).toHaveURL(/__qa__\/stripe-checkout/);
        const b = captured.body!;
        expect(b, "결제 요청 본문").toBeTruthy();
        expect(b.selectedTour).toBe(tour.tour_id);
        expect(b.adultCount).toBe(2);
        expect(b.childCount).toBe(0);
        expect(String(b.tourDate)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(b.currency).toBe(lang === "ko" ? "KRW" : "USD");
        expect(b.lang).toBe(lang);
        expect(b.bookerEmail).toBe("qa-test@example.com");
        expect(b.bookerName).toBe("QA 테스트");
        expect(b.pickupLocationId || b.hotelName, "픽업 장소 또는 숙소").toBeTruthy();
        expect(guard.pageErrors()).toEqual([]);
    });
}

test("예약: 날짜 없이 결제하면 막고 안내한다", async ({ page }) => {
    await installGuard(page);
    const captured = await interceptCheckout(page);
    const tour = await pickPlainTour(page);
    const root = await openBooking(page, "ko");
    await chooseTour(root, tour, "ko");
    await root.getByRole("button", { name: L.ko.bookingModal.checkout_btn, exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "날짜" })).toBeVisible();
    expect(captured.body, "검증 실패인데 결제 요청이 나감").toBeUndefined();
});
