import { fetchLanguageDefaultBible } from '$lib/utils/bibles-fetcher';
import { fetchBibleBookTexts, type BibleBookTexts } from '$lib/utils/bible-book-fetcher';
import { parseVerseId, type Verse } from './bible-passage-utils';

export async function fetchBiblePassages(
    startVerseId: number,
    endVerseId: number,
    languageId: number,
    passedBibleId?: number
): Promise<BibleBookTexts[]> {
    const start = parseVerseId(startVerseId);
    const end = parseVerseId(endVerseId);
    const spansMultipleBooks = start.bookId !== end.bookId;
    let bibleId: number = passedBibleId ?? 1;

    const texts: BibleBookTexts[] = [];

    if (!passedBibleId) {
        const bible = await fetchLanguageDefaultBible(languageId);
        bibleId = bible?.id ?? 1;
    }

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
