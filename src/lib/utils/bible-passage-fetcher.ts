import { log } from '$lib/logger';
import { getFromApi } from '$lib/utils/http-service';

type PassageRangeId = number;

let bibleCache: Bible[] | null = null;
const bibleTextCache: Record<PassageRangeId, BibleText> = {};

interface Bible {
    id: number;
    name: string;
    languageId: number;
    isLanguageDefault: boolean;
}

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
    // TODO move to its own component, see if bible-book-fetcher is needed anymore
    await getCachedBibles();
    console.log(bibleCache);
    const bibleId = bibleCache?.find((b) => b.languageId === languageId && b.isLanguageDefault)?.id ?? 1;

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

const getCachedBibles = async () => {
    if (bibleCache === null) {
        console.log('filling Bibles cache');
        try {
            bibleCache = await getFromApi<Bible[]>('/bibles');
        } catch (error) {
            log.exception(error);
        }
    }
};

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

// const getPassage = (
//     book: Book,
//     start: ParsedVerse,
//     end: ParsedVerse,
//     bibleBookName: BibleBooksResponse
// ): BookPassage => {
//     const passage: BookPassage = {
//         book: {
//             id: bibleBookName.id,
//             name: bibleBookName.name,
//         },
//         chapters: [],
//     };
//
//     for (let chapter = start.chapter; chapter <= end.chapter; chapter++) {
//         const chapterData = book.chapters.find((c) => c.number === chapter.toString());
//         if (chapterData) {
//             const passageChapter: PassageChapter = {
//                 number: chapter,
//                 verses: [],
//             };
//             let startVerseIndex = 0;
//             let endVerseIndex = chapterData.verses.length - 1;
//
//             if (chapter === start.chapter) {
//                 startVerseIndex = chapterData.verses.findIndex((v) => v.number === start.verse.toString());
//             }
//             if (chapter === end.chapter) {
//                 endVerseIndex = chapterData.verses.findIndex((v) => v.number === end.verse.toString());
//             }
//
//             for (let i = startVerseIndex; i <= endVerseIndex; i++) {
//                 const verse = chapterData.verses[i];
//                 if (verse) {
//                     passageChapter.verses.push({
//                         number: Number(verse.number),
//                         text: verse.text,
//                     });
//                 }
//             }
//
//             passage.chapters.push(passageChapter);
//         }
//     }
//
//     return passage;
// };

const parseVerseId = (verseId: string): ParsedVerse => {
    return {
        bookId: Number(verseId.substring(1, 4)),
        chapter: Number(verseId.substring(4, 7)),
        verse: Number(verseId.substring(7, 10)),
    };
};
