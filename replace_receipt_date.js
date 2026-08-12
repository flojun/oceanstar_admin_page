const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'src/app/api/cron/check-myrealtrip-emails/route.ts',
    'src/app/api/stripe/checkout/route.ts',
    'src/app/api/pay2pay/checkout/route.ts',
    'src/app/api/pay2pay/webhook/route.ts',
    'src/app/api/eximbay/webhook/route.ts'
];

for (const relPath of filesToUpdate) {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Add import for getDynamicReceiptDateStr
    if (!content.includes('getDynamicReceiptDateStr')) {
        content = content.replace(
            "import { getHawaiiDateStr , getReceiptDateStr } from '@/lib/timeUtils';",
            "import { getHawaiiDateStr , getReceiptDateStr } from '@/lib/timeUtils';\nimport { getDynamicReceiptDateStr } from '@/lib/serverTimeUtils';"
        );
        content = content.replace(
            "import { getReceiptDateStr } from '@/lib/timeUtils';",
            "import { getReceiptDateStr } from '@/lib/timeUtils';\nimport { getDynamicReceiptDateStr } from '@/lib/serverTimeUtils';"
        );
    }

    // 2. Replace getReceiptDateStr() with await getDynamicReceiptDateStr()
    // but only inside the request handler or where appropriate.
    // Actually just a global replace is mostly safe since these are all async route handlers.
    content = content.replace(/getReceiptDateStr\(\)/g, "await getDynamicReceiptDateStr()");

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${relPath}`);
}
