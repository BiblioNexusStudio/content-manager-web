import { fetchLanguageDefaultBible } from '$lib/utils/bibles-fetcher';
import { fetchBibleBookTexts, type BibleBookTexts } from '$lib/utils/bible-book-fetcher';
import { parseVerseId, type Verse } from './bible-passage-utils';

export async function fetchBiblePassages(
    startVerseId: number,
    endVerseId: number,
    languageId: number
): Promise<BibleBookTexts[]> {
    const start = parseVerseId(startVerseId);
    const end = parseVerseId(endVerseId);
    const spansMultipleBooks = start.bookId !== end.bookId;

    const texts: BibleBookTexts[] = [];
    const bible = await fetchLanguageDefaultBible(languageId);
    const bibleId = bible?.id ?? 1;

    for (let i = start.bookId; i <= end.bookId; i++) {
        let bookStart = start;
        let bookEnd = end;

        if (spansMultipleBooks && (start.bookId === i || (start.bookId !== i && end.bookId !== i))) {
            bookEnd = {
                bookId: i,
                chapter: 999,
                verse: 999,
            };
        }

        if (spansMultipleBooks && (end.bookId === i || (start.bookId !== i && end.bookId !== i))) {
            bookStart = {
                bookId: i,
                chapter: 0,
                verse: 0,
            };
        }

        const text = await getText(bibleId, bookStart, bookEnd);
        if (text) {
            texts.push(text);
        }
    }

    return texts;
}

const getText = async (bibleId: number, start: Verse, end: Verse): Promise<BibleBookTexts | null> => {
    const bibleBook = await fetchBibleBookTexts(bibleId, start.bookId);
    if (bibleBook) {
        bibleBook.chapters = bibleBook.chapters.filter((b) => b.number >= start.chapter && b.number <= end.chapter);
        if (!bibleBook.chapters[0]) {
            // the Bible is missing expected data, return null rather than blowing up on the lines below
            return null;
        }
        bibleBook.chapters[0].verses = bibleBook.chapters[0].verses.filter((v) => v.number >= start.verse);
        bibleBook.chapters.at(-1)!.verses = bibleBook.chapters.at(-1)!.verses.filter((v) => v.number <= end.verse);
    }

    return bibleBook;
};
