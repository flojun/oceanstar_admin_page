import { useState, useMemo } from 'react';
import { Reservation } from '@/types/reservation';

export type FilterTab = '전체' | '1부' | '2부' | '3부' | '패러 및 제트' | '패러' | '제트' | '기타';

// Define Option Groups for Sorting
const GROUP_ORDER = ['1부', '2부', '3부', '패러 및 제트', '패러', '제트', '기타'];

// Sort Options Type
export type SortOption =
    | 'receipt_asc'
    | 'receipt_desc'
    | 'source'
    | 'pickup';

export function useReservationFilter(initialData: Reservation[]) {
    const [activeTab, setActiveTab] = useState<FilterTab>('전체');
    const [sortOption, setSortOption] = useState<SortOption>('receipt_asc'); // Default sort

    // Helper to sort a list based on current sortOption
    const sortList = (list: Reservation[]) => {
        return [...list].sort((a, b) => {
            switch (sortOption) {
                case 'receipt_asc':
                    return (a.receipt_date || '').localeCompare(b.receipt_date || '');
                case 'receipt_desc':
                    return (b.receipt_date || '').localeCompare(a.receipt_date || '');
                case 'source':
                    // Custom Order: M -> T -> Z -> W ...
                    const order = ['m', 't', 'z', 'w'];
                    const srcA = (a.source || '').toLowerCase();
                    const srcB = (b.source || '').toLowerCase();
                    const idxA = order.indexOf(srcA);
                    const idxB = order.indexOf(srcB);

                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1; // A is in custom list, B is not
                    if (idxB !== -1) return 1;  // B is in custom list, A is not
                    return srcA.localeCompare(srcB); // Alphabetical fallback
                case 'pickup':
                    return (a.pickup_location || '').localeCompare(b.pickup_location || '');
                default:
                    return 0;
            }
        });
    };

    const filteredData = useMemo(() => {
        let result: Reservation[] = [];
        if (activeTab === '전체') {
            result = [...initialData];
        } else {
            result = initialData.filter(item => {
                const group = getOptionGroup(item.option);
                return group === activeTab;
            });
        }
        return sortList(result);
    }, [initialData, activeTab, sortOption]);

    // Helper to get grouped sections for 'All' view
    const groupedSections = useMemo(() => {
        if (activeTab !== '전체') return null;

        const sections: Record<string, Reservation[]> = {};

        // Initialize sections in order
        GROUP_ORDER.forEach(g => sections[g] = []);

        initialData.forEach(item => {
            const group = getOptionGroup(item.option);
            if (sections[group]) {
                sections[group].push(item);
            } else {
                sections['기타'].push(item);
            }
        });

        // Apply Sort WITHIN each section
        Object.keys(sections).forEach(key => {
            sections[key] = sortList(sections[key]);
        });

        return sections;
    }, [initialData, activeTab, sortOption]);

    return {
        activeTab,
        setActiveTab,
        sortOption,
        setSortOption,
        filteredData,
        groupedSections
    };
}
// ... getOptionGroup ...

/**
 * Determines which group an option string belongs to.
 * This needs to be robust enough to handle variations.
 */
function getOptionGroup(option: string): string {
    if (!option) return '기타';
    const lower = option.toLowerCase().trim();

    // Specific Order Matters
    if (lower.includes('1부')) return '1부';
    if (lower.includes('2부')) return '2부';
    if (lower.includes('3부')) return '3부';

    // "Combined" Logic - if it has both or specific keywords
    // For now assuming "Combo" or just explicit requirement. 
    // If user inputs "패러 및 제트", it will match one of below if not careful.
    if ((lower.includes('패러') && lower.includes('제트')) || lower.includes('combo') || lower.includes('콤보')) return '패러 및 제트';

    if (lower.includes('패러') || lower.includes('parasail')) return '패러';
    if (lower.includes('제트') || lower.includes('jet')) return '제트';

    // "Turtle" removed as separate tab, usually falls into 1/2/3 or '기타' if just "Turtle Only" (rare/unspecified)

    return '기타';
}
