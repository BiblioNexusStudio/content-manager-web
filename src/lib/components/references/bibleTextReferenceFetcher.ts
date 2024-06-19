import { fetchBiblePassages } from '$lib/utils/bible-passage-fetcher';
import { generateVerseFromReference } from '$lib/utils/reference';
import type { BibleBook } from '$lib/utils/bible-book-fetcher';

export interface BibleTextsReference {
    verseDisplayName: string;
    isSingleBook: boolean;
    isSingleChapter: boolean;
    bookTexts: BibleBook[];
}

export const fetchAndFormat = async (
    startVerse: string,
    endVerse: string,
    languageId: number
): Promise<BibleTextsReference | null> => {
    const bookTexts = await fetchBiblePassages(startVerse, endVerse, languageId);

    if (!bookTexts || bookTexts.length === 0) {
        return null;
    }

    let verseDisplayName: string;
    if (
        bookTexts.length === 1 &&
        bookTexts[0]?.chapters.length === 1 &&
        bookTexts[0]?.chapters[0]?.verses.length === 1
    ) {
        verseDisplayName = generateVerseFromReference({
            verseId: 0,
            book: bookTexts[0].bookName,
            chapter: bookTexts[0].chapters[0].number,
            verse: bookTexts[0].chapters[0].verses[0]!.number,
        });
    } else {
        const passageStart = bookTexts[0]!;
        const passageEnd = bookTexts.at(-1)!;

        verseDisplayName = generateVerseFromReference({
            startVerseId: 0,
            startBook: passageStart.bookName,
            startChapter: passageStart.chapters[0]!.number,
            startVerse: passageStart.chapters[0]!.verses[0]!.number,
            endVerseId: 0,
            endBook: passageEnd.bookName,
            endChapter: passageEnd.chapters.at(-1)!.number,
            endVerse: passageEnd.chapters.at(-1)!.verses.at(-1)!.number,
        });
    }

    const isSingleBook = bookTexts.length === 1;
    return {
        verseDisplayName,
        isSingleBook,
        isSingleChapter: isSingleBook && bookTexts[0]!.chapters.length === 1,
        bookTexts,
    };
};
