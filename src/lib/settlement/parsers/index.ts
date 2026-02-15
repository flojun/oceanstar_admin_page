// Platform parser registry — Strategy Pattern

import { SettlementRow, PlatformKey } from '@/types/settlement';
import { parseMyRealTrip } from './myRealTrip';
import { parseZoomZoom } from './zoomZoom';
import { parseTriple } from './triple';
import { parseWaug } from './waug';

export interface ParseResult {
    rows: SettlementRow[];
    errors: string[];
}

export type PlatformParser = (file: File) => Promise<ParseResult>;

const parserMap: Record<PlatformKey, PlatformParser> = {
    myRealTrip: parseMyRealTrip,
    zoomZoom: parseZoomZoom,
    triple: parseTriple,
    waug: parseWaug,
};

export function getParser(platform: PlatformKey): PlatformParser {
    return parserMap[platform];
}

export { parseMyRealTrip, parseZoomZoom, parseTriple, parseWaug };
