import { log } from '$lib/logger';
import { getFromApi } from '$lib/utils/http-service';

type BookId = number;

const bookJsonCache: Record<BookId, BookJson> = {};

interface BookJson {
    chapters: { number: string; verses: { number: string; text: string }[] }[];
}

export interface Verse {
    chapterNumber: number;
    verseNumber: number;
    text: string;
}

export async function fetchBiblePassage(startVerseId: string, endVerseId: string): Promise<Verse[]> {
    const start = parseVerseId(startVerseId);
    const end = parseVerseId(endVerseId);

    let bookJson: BookJson | null = null;
    if (bookJsonCache[start.bookId]) {
        bookJson = bookJsonCache[start.bookId]!;
    } else {
        const englishLanguageId = 1;
        if (englishLanguageId) {
            try {
                bookJson = await getFromApi<BookJson>(
                    `/bibles/language/${englishLanguageId}/book/${start.bookId}/text`
                );
                if (bookJson) {
                    bookJsonCache[start.bookId] = bookJson;
                }
            } catch (error) {
                log.exception(error);
            }
        }
    }

    if (!bookJson) {
        return [];
    }

    const verses: Verse[] = [];

    for (let chapter = start.chapter; chapter <= end.chapter; chapter++) {
        const chapterData = bookJson.chapters.find((c) => c.number === chapter.toString());
        if (chapterData) {
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
                    verses.push({
                        chapterNumber: chapter,
                        verseNumber: Number(verse.number),
                        text: verse.text,
                    });
                }
            }
        }
    }

    return verses;
}

const parseVerseId = (verseId: string) => {
    return {
        bookId: Number(verseId.substring(1, 4)),
        chapter: Number(verseId.substring(4, 7)),
        verse: Number(verseId.substring(7, 10)),
    };
};
