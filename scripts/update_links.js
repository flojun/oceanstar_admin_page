const fs = require('fs');
const path = require('path');

const replaceInFile = (relPath, replacements) => {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) {
        console.log('Not found:', relPath);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    for (const {from, to} of replacements) {
        if (content.includes(from)) {
            content = content.replaceAll(from, to);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', relPath);
    } else {
        console.log('No changes in:', relPath);
    }
};

// 1. ReservationClientPage.tsx
replaceInFile('src/components/landing/ReservationClientPage.tsx', [
    { from: "targetLang === 'en' ? '/en' : '/'", to: "targetLang === 'en' ? '/' : '/kr'" },
    { from: "targetLang === 'en' ? '/en' : '/'", to: "targetLang === 'en' ? '/' : '/kr'" }, // just in case
    { from: "lang === 'en' ? '/en/manage-booking' : '/manage-booking'", to: "lang === 'en' ? '/manage-booking' : '/kr/manage-booking'" },
    { from: "lang === 'en' ? '/en/restaurants' : '/restaurants'", to: "lang === 'en' ? '/restaurants' : '/kr/restaurants'" }
]);

// 2. Canonical URLs in English pages
replaceInFile('src/app/(en)/page.tsx', [
    { from: "https://www.oceanstarhawaii.com/en", to: "https://www.oceanstarhawaii.com" },
    { from: "https://www.oceanstarhawaii.com\"", to: "https://www.oceanstarhawaii.com\"" } // Need to be careful here...
]);
replaceInFile('src/app/(en)/manage-booking/page.tsx', [
    { from: "https://www.oceanstarhawaii.com/en/manage-booking", to: "https://www.oceanstarhawaii.com/manage-booking" }
]);

// 3. Canonical URLs in Korean pages
replaceInFile('src/app/(ko)/kr/page.tsx', [
    { from: "canonical: \"https://www.oceanstarhawaii.com\"", to: "canonical: \"https://www.oceanstarhawaii.com/kr\"" },
    { from: "\"ko-KR\": \"https://www.oceanstarhawaii.com\"", to: "\"ko-KR\": \"https://www.oceanstarhawaii.com/kr\"" },
    { from: "\"en-US\": \"https://www.oceanstarhawaii.com/en\"", to: "\"en-US\": \"https://www.oceanstarhawaii.com\"" }
]);
replaceInFile('src/app/(ko)/kr/manage-booking/page.tsx', [
    { from: "canonical: \"https://www.oceanstarhawaii.com/manage-booking\"", to: "canonical: \"https://www.oceanstarhawaii.com/kr/manage-booking\"" },
    { from: "\"ko-KR\": \"https://www.oceanstarhawaii.com/manage-booking\"", to: "\"ko-KR\": \"https://www.oceanstarhawaii.com/kr/manage-booking\"" },
    { from: "\"en-US\": \"https://www.oceanstarhawaii.com/en/manage-booking\"", to: "\"en-US\": \"https://www.oceanstarhawaii.com/manage-booking\"" }
]);

// 4. Booking checkout returns
replaceInFile('src/app/(en)/booking/payment-success/page.tsx', [
    { from: 'router.replace("/en")', to: 'router.replace("/")' }
]);
replaceInFile('src/app/(en)/booking/payment-cancel/page.tsx', [
    { from: 'href="/en"', to: 'href="/"' }
]);
replaceInFile('src/app/(ko)/kr/booking/payment-success/page.tsx', [
    { from: 'router.replace("/")', to: 'router.replace("/kr")' }
]);
replaceInFile('src/app/(ko)/kr/booking/payment-cancel/page.tsx', [
    { from: 'href="/"', to: 'href="/kr"' }
]);

// 5. Sitemap
replaceInFile('src/app/sitemap.ts', [
    { from: 'url: `${baseUrl}/en`,', to: 'url: `${baseUrl}`, // English is now at root' },
    { from: 'url: `${baseUrl}/en/manage-booking`,', to: 'url: `${baseUrl}/manage-booking`,' },
    { from: 'url: `${baseUrl}`,', to: 'url: `${baseUrl}/kr`,' }, // The original root was Korean
    { from: 'url: `${baseUrl}/manage-booking`,', to: 'url: `${baseUrl}/kr/manage-booking`,' }
]);
