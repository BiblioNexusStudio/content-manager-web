import { log } from '$lib/logger';
import { getFromApi } from '$lib/utils/http-service';
import { fetchLanguageDefaultBible } from '$lib/utils/bibles-fetcher';

type PassageRangeId = number;

const bibleTextCache: Record<PassageRangeId, BibleText> = {};

interface ParsedVerse {
    bookId: number;
    chapter: number;
    verse: number;
}

interface PassageChapter {
    number: number;
    verses: { number: number; text: string }[];
}

export interface BibleText {
    bookName: string;
    bookNumber: number;
    chapters: PassageChapter[];
}

export async function fetchBiblePassages(
    startVerseId: string,
    endVerseId: string,
    languageId: number
): Promise<BibleText[]> {
    const bibleTextId = +(languageId + startVerseId + endVerseId);
    console.log(bibleTextId);
    const start = parseVerseId(startVerseId);
    const end = parseVerseId(endVerseId);
    const spansMultipleBooks = start.bookId !== end.bookId;

    const texts: BibleText[] = [];
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

        const text = await getCachedBibleText(bibleTextId, bibleId, bookStart, bookEnd);
        if (text) {
            texts.push(text);
        }
    }

    return texts;
}

const getCachedBibleText = async (bibleTextId: number, bibleId: number, start: ParsedVerse, end: ParsedVerse) => {
    let bibleText: BibleText | null = null;

    if (bibleTextCache[bibleTextId]) {
        bibleText = bibleTextCache[bibleTextId]!;
    } else {
        try {
            bibleText = await getFromApi<BibleText>(
                `/bibles/${bibleId}/texts?startChapter=${start.chapter}&endChapter=${end.chapter}&bookNumber=${start.bookId}&startVerse=${start.verse}&endVerse=${end.verse}`
            );
            if (bibleText) {
                bibleTextCache[bibleTextId] = bibleText;
            }
        } catch (error) {
            log.exception(error);
        }
    }

    return bibleText;
};

const parseVerseId = (verseId: string): ParsedVerse => {
    return {
        bookId: Number(verseId.substring(1, 4)),
        chapter: Number(verseId.substring(4, 7)),
        verse: Number(verseId.substring(7, 10)),
    };
};
