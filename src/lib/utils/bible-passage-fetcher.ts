import { fetchBibleBookTexts, type BibleBookTexts } from '$lib/utils/bible-book-fetcher';
import { parseVerseId, type Verse } from './bible-passage-utils';

export async function fetchBiblePassages(
    startVerseId: number,
    endVerseId: number,
    bibleId: number
): Promise<BibleBookTexts[]> {
    const start = parseVerseId(startVerseId);
    const end = parseVerseId(endVerseId);
    const spansMultipleBooks = start.bookId !== end.bookId;
    const texts: BibleBookTexts[] = [];

    for (let i = start.bookId; i <= end.bookId; i++) {
        let bookStart = start;

        if (spansMultipleBooks && (end.bookId === i || (start.bookId !== i && end.bookId !== i))) {
            bookStart = {
                bookId: i,
                chapter: 0,
                verse: 0,
            };
        }

        const text = await getText(bibleId, bookStart);
        if (text) {
            texts.push(text);
        }
    }

    return texts;
}

const getText = async (bibleId: number, start: Verse): Promise<BibleBookTexts | null> => {
    const bibleBook = await fetchBibleBookTexts(bibleId, start.bookId);
    if (bibleBook && bibleBook.chapters.length === 0) {
        return null;
    }

    return bibleBook;
};
