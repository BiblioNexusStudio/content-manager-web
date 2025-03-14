import { log } from '$lib/logger';
import type { VerseReference } from '$lib/types/resources';
import { parseVerseId } from './bible-passage-utils';
import { getFromApi } from './http-service';
import { fetchLanguageDefaultBible } from './bibles-fetcher';

export interface VersificationResponse {
    verseMappings: VerseMapping[];
}

export interface VerseMapping {
    sourceVerse: VerseReference;
    targetVerse: VerseReference;
}

export async function fetchBibleVersification(
    startVerseId: number,
    endVerseId: number,
    languageId: number,
    bibleId?: number
): Promise<VerseMapping[] | null> {
    const start = parseVerseId(startVerseId);
    const end = parseVerseId(endVerseId);
    bibleId = bibleId ?? 0;

    if (bibleId === 0) {
        const langDefaultBible = await fetchLanguageDefaultBible(languageId);
        if (langDefaultBible) {
            bibleId = langDefaultBible.id;
        }
    }

    const allMappings: VerseMapping[] = [];

    try {
        // If we have multiple books, fetch versification for each book
        for (let i = start.bookId; i <= end.bookId; i++) {
            const response = await getFromApi<VersificationResponse>(`/bibles/${bibleId}/versification?bookId=${i}`);
            if (response.verseMappings && response.verseMappings.length > 0) {
                for (const mapping of response.verseMappings) {
                    if (mapping.targetVerse) {
                        allMappings.push(mapping);
                    }
                }
            }
        }

        return allMappings.length > 0 ? allMappings : null;
    } catch (error) {
        log.exception(error);
        return null;
    }
}
