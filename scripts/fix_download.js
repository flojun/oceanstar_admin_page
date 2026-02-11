const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'crew', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Update the cloneWithStyles function to handle Select elements explicitly
const oldCloneLogic = `                // Clone children recursively
                src.childNodes.forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        clone.appendChild(child.cloneNode(true));
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        clone.appendChild(cloneWithStyles(child as Element));
                    }
                });`;

const newCloneLogic = `                // Handle Select elements: manually copy value to attribute
                if (src instanceof HTMLSelectElement) {
                    (clone as HTMLSelectElement).value = src.value;
                    // Also set attribute for good measure
                    const selectedIdx = src.selectedIndex;
                    if (selectedIdx !== -1) {
                         const options = clone.querySelectorAll('option');
                         if (options[selectedIdx]) options[selectedIdx].setAttribute('selected', 'true');
                    }
                }

                // Clone children recursively
                src.childNodes.forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        clone.appendChild(child.cloneNode(true));
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        clone.appendChild(cloneWithStyles(child as Element));
                    }
                });`;

if (content.includes(oldCloneLogic)) {
    content = content.replace(oldCloneLogic, newCloneLogic);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Successfully updated clone logic to preserve select values');
} else {
    // If exact match fails, try replacing the entire function again with the fix
    // This is safer fallback
    console.log('Exact match failed, replacing entire function...');

    const fnStart = '    const handleDownloadImage = async () => {';
    const startIdx = content.indexOf(fnStart);
    let braceCount = 0;
    let endIdx = -1;
    let started = false;
    for (let i = startIdx; i < content.length; i++) {
        if (content[i] === '{') { braceCount++; started = true; }
        else if (content[i] === '}') {
            braceCount--;
            if (started && braceCount === 0) {
                endIdx = content.indexOf(';', i) + 1;
                break;
            }
        }
    }

    const newFn = `    const handleDownloadImage = async () => {
        const sc = gridRef.current;
        if (!sc) return;
        const tbl = sc.querySelector('table') as HTMLTableElement;
        if (!tbl) return;

        try {
            // 1. Determine unassigned days
            const uDays: number[] = [];
            weekDates.forEach((d, i) => {
                if (!schedules.some(s => s.date === format(d, "yyyy-MM-dd"))) uDays.push(i);
            });
            const hideSun = uDays.includes(0);
            const bDays = uDays.filter(i => !(hideSun && i === 0));

            // 2. Deep clone with computed styles -> inline styles (bypasses React & ensures style snapshot)
            // Also preserves Select values
            const cloneWithStyles = (src: Element): Element => {
                const clone = src.cloneNode(false) as HTMLElement;
                if (src instanceof HTMLElement) {
                    const cs = getComputedStyle(src);
                    let cssText = '';
                    for (let i = 0; i < cs.length; i++) {
                        const prop = cs[i];
                        cssText += prop + ':' + cs.getPropertyValue(prop) + ';';
                    }
                    clone.style.cssText = cssText;

                    // Manual fix for Select elements: copy value
                    if (src instanceof HTMLSelectElement) {
                        (clone as HTMLSelectElement).value = src.value;
                        const idx = src.selectedIndex;
                        // We also need to manipulate children options later if we want 'selected' attribute,
                        // but setting .value on the clone *after* appending children is usually better.
                        // However, since we clone children recursively below, we can set attribute on the option.
                    }
                }

                // Clone children recursively
                src.childNodes.forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        clone.appendChild(child.cloneNode(true));
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                         const childClone = cloneWithStyles(child as Element);
                         clone.appendChild(childClone);
                         
                         // If parent was select and this child is the selected option, mark it
                         if (src instanceof HTMLSelectElement && child instanceof HTMLOptionElement) {
                             if (child.selected) {
                                 (childClone as HTMLOptionElement).setAttribute('selected', 'true');
                                 (childClone as HTMLOptionElement).selected = true;
                             }
                         }
                    }
                });
                
                // Final value set for select
                if (src instanceof HTMLSelectElement) {
                     (clone as HTMLSelectElement).value = src.value;
                }

                return clone;
            };

            const clone = cloneWithStyles(tbl) as HTMLTableElement;
            
            // 3. Position Clone Correctly
            clone.style.position = 'absolute';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.zIndex = '-9999'; 
            clone.style.margin = '0';
            clone.style.transform = 'none';
            clone.style.width = tbl.scrollWidth + 'px';
            clone.style.minWidth = tbl.scrollWidth + 'px';
            clone.style.maxWidth = 'none';
            clone.style.height = tbl.scrollHeight + 'px';
            
            clone.querySelectorAll('th, td').forEach(el => {
                const h = el as HTMLElement;
                h.style.position = 'static';
                h.style.left = 'auto'; 
                h.style.top = 'auto';
                h.style.zIndex = 'auto';
            });

            const hRows = clone.querySelectorAll('thead tr');
            const bRows = clone.querySelectorAll('tbody tr');

            // 4. Hide Sunday column if unassigned
            if (hideSun) {
                if (hRows[0]) {
                    const t = hRows[0].querySelectorAll('th');
                    if (t[1]) (t[1] as HTMLElement).style.display = 'none';
                }
                [hRows[1], hRows[2]].forEach(r => {
                    if (!r) return;
                    const c = r.querySelectorAll('th');
                    for (let s = 0; s < 3; s++) if (c[s]) (c[s] as HTMLElement).style.display = 'none';
                });
                bRows.forEach(r => {
                    const c = r.querySelectorAll('td');
                    for (let s = 0; s < 3; s++) if (c[1+s]) (c[1+s] as HTMLElement).style.display = 'none';
                });
            }

            // 5. Blackout unassigned days
            bDays.forEach(di => {
                // Header rows 1,2 (options + captains)
                [hRows[1], hRows[2]].forEach(r => {
                    if (!r) return;
                    const c = r.querySelectorAll('th');
                    for (let s = 0; s < 3; s++) {
                        const ci = di * 3 + s;
                        if (c[ci]) {
                            const el = c[ci] as HTMLElement;
                            el.style.backgroundColor = '#000000';
                            el.style.color = '#000000';
                            el.textContent = ''; 
                            Array.from(el.children).forEach(child => {
                                (child as HTMLElement).style.display = 'none';
                            });
                        }
                    }
                });
                // Body rows
                bRows.forEach(r => {
                    const c = r.querySelectorAll('td');
                    for (let s = 0; s < 3; s++) {
                        const ci = 1 + di * 3 + s;
                        if (c[ci]) {
                            const td = c[ci] as HTMLElement;
                            td.style.backgroundColor = '#000000';
                            td.style.color = '#000000';
                            td.textContent = ''; 
                            Array.from(td.children).forEach(child => {
                                (child as HTMLElement).style.display = 'none';
                            });
                        }
                    }
                });
            });

            // 6. Append clone, capture, remove
            document.body.appendChild(clone);
            await new Promise(resolve => requestAnimationFrame(resolve));

            const dataUrl = await toPng(clone, { 
                cacheBust: true, 
                backgroundColor: 'white', 
                pixelRatio: 2,
                fontEmbedCSS: '', 
            });
            
            document.body.removeChild(clone);

            // 7. Download
            const link = document.createElement('a');
            link.download = \`crew-schedule-\${format(weekDates[0], "yyyy-MM-dd")}.png\`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Image export error:', err);
            alert("\\uc774\\ubbf8\\uc9c0 \\uc800\\uc7a5 \\uc2e4\\ud328");
        }
    };`;

    content = content.substring(0, startIdx) + newFn + content.substring(endIdx);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Successfully replaced entire function with select fix');
}
