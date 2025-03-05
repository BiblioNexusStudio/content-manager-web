import { log } from '$lib/logger';
import { getFromApi } from '$lib/utils/http-service';
import type { ApiError } from './http-errors';

export interface BibleBookTexts {
    bookName: string;
    bookNumber: number;
    chapters: BibleBookChapters[];
}

interface VerseReference {
    BookName: string;
    Chapter: number;
    Verse: number;
}

interface BibleBookChapters {
    number: number;
    verses: { number: number; text: string; englishBaseVerseMapping: VerseReference | null }[];
}

export async function fetchBibleBookTexts(bibleId: number, bookId: number): Promise<BibleBookTexts | null> {
    try {
        return await getFromApi<BibleBookTexts>(`/bibles/${bibleId}/texts?bookNumber=${bookId}`);
    } catch (error) {
        const castError = error as ApiError | Error;
        if ('isApiError' in castError) {
            if (castError.status === 404) {
                // don't log since 404s are expected when we're missing a book
                return null;
            }
        }
        log.exception(error);
        return null;
    }
}
