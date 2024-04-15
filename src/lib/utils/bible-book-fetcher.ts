import { log } from '$lib/logger';
import { getFromApi } from '$lib/utils/http-service';

type BookId = number;

const bibleBookNamesJsonCache: Record<BookId, BibleBooksResponse> = {};

export interface BibleBooksResponse {
    id: BookId;
    name: string;
    code: string;
}

export async function fetchBibleBooks(bookId: number): Promise<BibleBooksResponse | null> {
    if (!bibleBookNamesJsonCache[bookId]) {
        try {
            const response = await getFromApi<BibleBooksResponse[]>(`/bible-books`);
            if (response) {
                response.forEach((book) => {
                    bibleBookNamesJsonCache[book.id] = book;
                });
            }
        } catch (error) {
            log.exception(error);
            return null;
        }
    }

    return bibleBookNamesJsonCache[bookId] ?? null;
}
