const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const oldStr = `            if (totalCount <= 4) usdPrice = 1800;
            else if (totalCount <= 10) usdPrice = 2200;
            else if (totalCount <= 20) usdPrice = 2800;
            else if (totalCount <= 30) usdPrice = 3500;
            else usdPrice = 4500;`;
            
    const newStr = `            if (totalCount <= 10) usdPrice = 1200;
            else if (totalCount <= 20) usdPrice = 1800;
            else if (totalCount <= 30) usdPrice = 2400;
            else usdPrice = 3000;`;

    if (content.includes(oldStr)) {
        content = content.replace(oldStr, newStr);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Replaced in ${filePath}`);
    } else {
        console.log(`Not found in ${filePath}`);
    }
}

replaceFile(path.join(__dirname, 'src/app/api/stripe/checkout/route.ts'));
replaceFile(path.join(__dirname, 'src/app/api/pay2pay/checkout/route.ts'));
