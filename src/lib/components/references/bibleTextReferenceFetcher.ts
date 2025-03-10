import { fetchBiblePassages } from '$lib/utils/bible-passage-fetcher';
import { generateVerseFromReference } from '$lib/utils/reference';
import type { BibleBookTexts } from '$lib/utils/bible-book-fetcher';
import { log } from '$lib/logger';
import type { Language } from '$lib/types/base';

export interface BibleTextsReference {
    verseDisplayName: string;
    isSingleBook: boolean;
    isSingleChapter: boolean;
    bookTexts: BibleBookTexts[];
}

export const fetchAndFormat = async (
    startVerse: number,
    endVerse: number,
    language: Language,
    passedBibleId?: number
): Promise<BibleTextsReference | null> => {
    const bookTexts = await fetchBiblePassages(startVerse, endVerse, language.id, passedBibleId);

    if (!bookTexts || bookTexts.length === 0) {
        return null;
    }

    let verseDisplayName = '';
    const passageHasDifferentBase = passageHasDifferentBaseMappings(bookTexts);
    if (
        bookTexts.length === 1 &&
        bookTexts[0]?.chapters.length === 1 &&
        bookTexts[0]?.chapters[0]?.verses.length === 1
    ) {
        verseDisplayName = generateVerseFromReference(
            {
                verseId: 0,
                book: bookTexts[0].bookName,
                chapter: bookTexts[0].chapters[0].number,
                verse: bookTexts[0].chapters[0].verses[0]!.number,
            },
            language.scriptDirection,
            passageHasDifferentBase
        );
    } else {
        const passageStart = bookTexts[0]!;
        const passageEnd = bookTexts.at(-1)!;

        if (passageStart.chapters[0]?.verses[0] && passageEnd.chapters.at(-1)!.verses.at(-1)) {
            verseDisplayName = generateVerseFromReference(
                {
                    startVerseId: 0,
                    startBook: passageStart.bookName,
                    startChapter: passageStart.chapters[0]!.number,
                    startVerse: passageStart.chapters[0]!.verses[0]!.number,
                    endVerseId: 0,
                    endBook: passageEnd.bookName,
                    endChapter: passageEnd.chapters.at(-1)!.number,
                    endVerse: passageEnd.chapters.at(-1)!.verses.at(-1)!.number,
                },
                language.scriptDirection,
                passageHasDifferentBase
            );
        } else {
            log.exception(
                new Error(
                    `Unexpected issue while building verse display name. startVerse: ${startVerse} endVerse: ${endVerse} languageId: ${
                        language.id
                    } bookTextsStart: ${bookTextDebugInfo(passageStart)} bookTextsEnd: ${bookTextDebugInfo(passageEnd)}`
                )
            );
        }
    }

    const isSingleBook = bookTexts.length === 1;
    return {
        verseDisplayName,
        isSingleBook,
        isSingleChapter: isSingleBook && bookTexts[0]!.chapters.length === 1,
        bookTexts,
    };
};

function bookTextDebugInfo(book: BibleBookTexts | undefined) {
    return JSON.stringify(
        book?.chapters.map((c) => ({ numberAndVerses: `${c.number}-${JSON.stringify(c.verses.map((v) => v.number))}` }))
    );
}

function passageHasDifferentBaseMappings(bookTexts: BibleBookTexts[]): boolean {
    return !!bookTexts.some((b) => b.chapters.some((c) => c.verses.some((v) => v.sourceTextVerseReference)));
}
