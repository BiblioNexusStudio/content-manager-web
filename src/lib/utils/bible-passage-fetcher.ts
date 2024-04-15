import { log } from '$lib/logger';
import { getFromApi } from '$lib/utils/http-service';
import { type BibleBooksResponse, fetchBibleBooks } from '$lib/utils/bible-book-fetcher';

type BookId = number;

const bookCache: Record<BookId, Book> = {};

interface Book {
    chapters: { number: string; verses: { number: string; text: string }[] }[];
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

export interface BookPassage {
    book: {
        id: number;
        name: string;
    };
    chapters: PassageChapter[];
}

export async function fetchBiblePassages(startVerseId: string, endVerseId: string): Promise<BookPassage[]> {
    const start = parseVerseId(startVerseId);
    const end = parseVerseId(endVerseId);
    const spansMultipleBooks = start.bookId !== end.bookId;

    const passages: BookPassage[] = [];

    for (let i = start.bookId; i <= end.bookId; i++) {
        const book = await getCachedBook(i);
        if (book) {
            const bibleBookName = await fetchBibleBooks(i);

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

            const passage = getPassage(book, bookStart, bookEnd, bibleBookName!);
            passages.push(passage);
        }
    }

    return passages;
}

const getCachedBook = async (bookId: number) => {
    let book: Book | null = null;

    if (bookCache[bookId]) {
        book = bookCache[bookId]!;
    } else {
        const englishLanguageId = 1;
        if (englishLanguageId) {
            try {
                book = await getFromApi<Book>(`/bibles/language/${englishLanguageId}/book/${bookId}/text`);
                if (book) {
                    bookCache[bookId] = book;
                }
            } catch (error) {
                log.exception(error);
            }
        }
    }

    return book;
};

const getPassage = (
    book: Book,
    start: ParsedVerse,
    end: ParsedVerse,
    bibleBookName: BibleBooksResponse
): BookPassage => {
    const passage: BookPassage = {
        book: {
            id: bibleBookName.id,
            name: bibleBookName.name,
        },
        chapters: [],
    };

    for (let chapter = start.chapter; chapter <= end.chapter; chapter++) {
        const chapterData = book.chapters.find((c) => c.number === chapter.toString());
        if (chapterData) {
            const passageChapter: PassageChapter = {
                number: chapter,
                verses: [],
            };
            let startVerseIndex = 0;
            let endVerseIndex = chapterData.verses.length - 1;

            if (chapter === start.chapter) {
                startVerseIndex = chapterData.verses.findIndex((v) => v.number === start.verse.toString());
            }
            if (chapter === end.chapter) {
                endVerseIndex = chapterData.verses.findIndex((v) => v.number === end.verse.toString());
            }

            for (let i = startVerseIndex; i <= endVerseIndex; i++) {
                const verse = chapterData.verses[i];
                if (verse) {
                    passageChapter.verses.push({
                        number: Number(verse.number),
                        text: verse.text,
                    });
                }
            }

            passage.chapters.push(passageChapter);
        }
    }

    return passage;
};

const parseVerseId = (verseId: string): ParsedVerse => {
    return {
        bookId: Number(verseId.substring(1, 4)),
        chapter: Number(verseId.substring(4, 7)),
        verse: Number(verseId.substring(7, 10)),
    };
};
