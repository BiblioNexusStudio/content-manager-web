import { log } from '$lib/logger';
import type { Language } from '$lib/types/base';
import { getFromApi } from '$lib/utils/http-service';

type BookCode = string;

const bookJsonCache: Record<BookCode, BookJson> = {};

interface BookJson {
    chapters: { number: string; verses: { number: string; text: string }[] }[];
}

export interface Verse {
    chapterNumber: string;
    verseNumber: string;
    text: string;
}

export async function fetchBiblePassage(
    languages: Language[],
    bookCode: string,
    startChapter: number,
    startVerse: number,
    endChapter: number,
    endVerse: number
): Promise<Verse[] | null> {
    let bookJson: BookJson | null = null;
    if (bookJsonCache[bookCode]) {
        bookJson = bookJsonCache[bookCode]!;
    } else {
        const englishLanguageId = languages.find((l) => l.iso6393Code.toLowerCase() === 'eng')?.id;
        if (englishLanguageId) {
            try {
                bookJson = await getFromApi<BookJson>(`/bibles/language/${englishLanguageId}/book/${bookCode}/text`);
                if (bookJson) {
                    bookJsonCache[bookCode] = bookJson;
                }
            } catch (error) {
                log.exception(error);
            }
        }
    }

    if (!bookJson) {
        return null;
    }

    const verses: Verse[] = [];

    for (let chapter = startChapter; chapter <= endChapter; chapter++) {
        const chapterData = bookJson.chapters.find((c) => c.number === chapter.toString());
        if (chapterData) {
            let startVerseIndex = 0;
            let endVerseIndex = chapterData.verses.length - 1;

            if (chapter === startChapter) {
                startVerseIndex = chapterData.verses.findIndex((v) => v.number === startVerse.toString());
            }
            if (chapter === endChapter) {
                endVerseIndex = chapterData.verses.findIndex((v) => v.number === endVerse.toString());
            }

            for (let i = startVerseIndex; i <= endVerseIndex; i++) {
                const verse = chapterData.verses[i];
                if (verse) {
                    verses.push({
                        chapterNumber: chapter.toString(),
                        verseNumber: verse.number,
                        text: verse.text,
                    });
                }
            }
        }
    }

    return verses;
}
