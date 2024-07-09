import { log } from '$lib/logger';
import { getFromApi } from '$lib/utils/http-service';
import type { ApiError } from './http-errors';

export interface BibleBook {
    bookName: string;
    bookNumber: number;
    chapters: BibleBookChapters[];
}

interface BibleBookChapters {
    number: number;
    verses: { number: number; text: string }[];
}

export async function fetchBibleBookTexts(bibleId: number, bookId: number): Promise<BibleBook | null> {
    try {
        return await getFromApi<BibleBook>(`/bibles/${bibleId}/texts?bookNumber=${bookId}`);
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
