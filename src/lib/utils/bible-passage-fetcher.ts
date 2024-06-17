import { fetchLanguageDefaultBible } from '$lib/utils/bibles-fetcher';
import { fetchBibleBookTexts, type BibleBook } from '$lib/utils/bible-book-fetcher';

interface ParsedVerse {
    bookId: number;
    chapter: number;
    verse: number;
}

export async function fetchBiblePassages(
    startVerseId: string,
    endVerseId: string,
    languageId: number
): Promise<BibleBook[]> {
    const start = parseVerseId(startVerseId);
    const end = parseVerseId(endVerseId);
    const spansMultipleBooks = start.bookId !== end.bookId;

    const texts: BibleBook[] = [];
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

const getText = async (bibleId: number, start: ParsedVerse, end: ParsedVerse): Promise<BibleBook | null> => {
    const bibleBook = await fetchBibleBookTexts(bibleId, start.bookId);
    if (bibleBook) {
        bibleBook.chapters = bibleBook.chapters.filter((b) => b.number >= start.chapter && b.number <= end.chapter);
        bibleBook.chapters[0]!.verses = bibleBook.chapters[0]!.verses.filter((v) => v.number >= start.verse);
        bibleBook.chapters.at(-1)!.verses = bibleBook.chapters.at(-1)!.verses.filter((v) => v.number <= end.verse);
    }

    return bibleBook;
};

const parseVerseId = (verseId: string): ParsedVerse => {
    return {
        bookId: Number(verseId.substring(1, 4)),
        chapter: Number(verseId.substring(4, 7)),
        verse: Number(verseId.substring(7, 10)),
    };
};
