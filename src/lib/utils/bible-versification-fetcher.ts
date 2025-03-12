import { log } from '$lib/logger';
import type { VerseReference } from '$lib/types/resources';
import { parseVerseId } from './bible-passage-utils';
import { getFromApi } from './http-service';

export interface VersificationResponse {
    verseMappings: VerseMapping[];
}

export interface VerseMapping {
    sourceBibleVerse: VerseReference;
    targetBibleVerse: VerseReference;
}

export async function fetchBibleVersification(
    startVerseId: number,
    endVerseId: number,
    bibleId?: number
): Promise<VerseMapping[] | null> {
    const start = parseVerseId(startVerseId);
    const end = parseVerseId(endVerseId);
    bibleId = bibleId ?? 1;

    const allMappings: VerseMapping[] = [];

    try {
        // If we have multiple books, fetch versification for each book
        for (let i = start.bookId; i <= end.bookId; i++) {
            const response = await getFromApi<VersificationResponse>(`/bibles/${bibleId}/versification?bookId=${i}`);
            if (response.verseMappings && response.verseMappings.length > 0) {
                for (const mapping of response.verseMappings) {
                    allMappings.push(mapping);
                }
            }
        }

        return allMappings.length > 0 ? allMappings : null;
    } catch (error) {
        log.exception(error);
        return null;
    }
}
