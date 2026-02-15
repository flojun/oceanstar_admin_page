import { ParseResult } from './index';

export async function parseWaug(file: File): Promise<ParseResult> {
    return { rows: [], errors: ['와그 파서는 아직 구현되지 않았습니다. 엑셀 포맷 확인 후 구현 예정입니다.'] };
}
