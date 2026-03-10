import { useState, useMemo } from 'react';
import { Reservation } from '@/types/reservation';
import { TourSetting, resolveOptionToTourSetting, getDisplayOrder } from '@/lib/tourUtils';

// Dynamic FilterTab type - now string based
export type FilterTab = string;

// Sort Options Type
export type SortOption =
    | 'receipt_asc'
    | 'receipt_desc'
    | 'source'
    | 'pickup';

export function useReservationFilter(initialData: Reservation[], tourSettings: TourSetting[] = []) {
    const [activeTab, setActiveTab] = useState<FilterTab>('전체');
    const [sortOption, setSortOption] = useState<SortOption>('receipt_asc');
    const [vesselFilter, setVesselFilter] = useState<string>('전체');

    // Dynamic group order from DB
    const groupOrder = useMemo(() => getDisplayOrder(tourSettings), [tourSettings]);

    // Helper to sort a list based on current sortOption
    const sortList = (list: Reservation[]) => {
        return [...list].sort((a, b) => {
            switch (sortOption) {
                case 'receipt_asc':
                    return (a.receipt_date || '').localeCompare(b.receipt_date || '');
                case 'receipt_desc':
                    return (b.receipt_date || '').localeCompare(a.receipt_date || '');
                case 'source': {
                    const order = ['m', 't', 'z', 'w'];
                    const srcA = (a.source || '').toLowerCase();
                    const srcB = (b.source || '').toLowerCase();
                    const idxA = order.indexOf(srcA);
                    const idxB = order.indexOf(srcB);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return srcA.localeCompare(srcB);
                }
                case 'pickup':
                    return (a.pickup_location || '').localeCompare(b.pickup_location || '');
                default:
                    return 0;
            }
        });
    };

    // Get option group using dynamic tour settings
    const getGroup = (option: string): string => {
        if (!option) return '기타';
        const resolved = resolveOptionToTourSetting(option, tourSettings);
        return resolved.group;
    };

    // Get vessel for an option
    const getVessel = (option: string): string => {
        const resolved = resolveOptionToTourSetting(option, tourSettings);
        return resolved.vessel;
    };

    const filteredData = useMemo(() => {
        let result: Reservation[] = [];

        if (activeTab === '전체') {
            result = [...initialData];
        } else {
            result = initialData.filter(item => {
                const group = getGroup(item.option);
                return group === activeTab;
            });
        }

        // Apply vessel filter
        if (vesselFilter !== '전체') {
            result = result.filter(item => getVessel(item.option) === vesselFilter);
        }

        return sortList(result);
    }, [initialData, activeTab, sortOption, vesselFilter, tourSettings]);

    // Grouped sections for 'All' view
    const groupedSections = useMemo(() => {
        if (activeTab !== '전체') return null;

        const sections: Record<string, Reservation[]> = {};
        groupOrder.forEach(g => sections[g] = []);

        let dataToGroup = initialData;
        // Apply vessel filter even in grouped view
        if (vesselFilter !== '전체') {
            dataToGroup = initialData.filter(item => getVessel(item.option) === vesselFilter);
        }

        dataToGroup.forEach(item => {
            const group = getGroup(item.option);
            if (sections[group]) {
                sections[group].push(item);
            } else {
                if (!sections['기타']) sections['기타'] = [];
                sections['기타'].push(item);
            }
        });

        // Sort within each section
        Object.keys(sections).forEach(key => {
            sections[key] = sortList(sections[key]);
        });

        return sections;
    }, [initialData, activeTab, sortOption, vesselFilter, tourSettings]);

    // Available vessels (derived from tour settings)
    const availableVessels = useMemo(() => {
        const vessels = new Set<string>();
        tourSettings.forEach(ts => {
            if (ts.vessel_name) vessels.add(ts.vessel_name);
        });
        return ['전체', ...Array.from(vessels)];
    }, [tourSettings]);

    return {
        activeTab,
        setActiveTab,
        sortOption,
        setSortOption,
        vesselFilter,
        setVesselFilter,
        filteredData,
        groupedSections,
        groupOrder,
        availableVessels,
        getGroup,
        getVessel,
    };
}
