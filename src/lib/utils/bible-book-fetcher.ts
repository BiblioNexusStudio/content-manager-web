import { log } from '$lib/logger';
import { getFromApi } from '$lib/utils/http-service';

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
        log.exception(error);
        return null;
    }
}
