import { fetchBiblePassages } from '$lib/utils/bible-passage-fetcher';
import { generateVerseFromReference } from '$lib/utils/reference';
import type { BibleBookChapters, BibleBookTexts } from '$lib/utils/bible-book-fetcher';
import { log } from '$lib/logger';
import type { Language } from '$lib/types/base';
import { fetchBibleVersification, type VerseMapping } from '$lib/utils/bible-versification-fetcher';
import { generateVerseId, parseVerseId, type Verse } from '$lib/utils/bible-passage-utils';
import { fetchLanguageDefaultBible } from '$lib/utils/bibles-fetcher';

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
    if (startVerse > endVerse) {
        log.exception(new Error(`Unexpected verseIds: startVerse: ${startVerse}; endVerse: ${endVerse}`));
        return null;
    }

    // ensure we always include verse 0 along with verse 1 if verse 0 exists
    if (startVerse % 1000 === 1) {
        startVerse -= 1;
    }

    // if no Bible was passed then get the default Bible for the language with a fallback of 1
    const bibleId =
        !passedBibleId || passedBibleId === 0
            ? ((await fetchLanguageDefaultBible(language.id))?.id ?? 1)
            : passedBibleId;

    const versificationMappings = await fetchBibleVersification(startVerse, endVerse, bibleId);
    const passageHasDifferentBaseMappings = doesPassageHaveDifferentBaseMappings(
        startVerse,
        endVerse,
        versificationMappings
    );

    let targetBibleStartVerseId = startVerse;
    let targetBibleEndVerseId = endVerse;

    // This logic assumes that all returned mappings are an exact range in the target Bible.  This is not necessarily true but is easier to reason about.
    // In the future we may need to update this logic to handle more complex mappings if real-world scenarios arise where mappings are non-consecutive verses.
    if (passageHasDifferentBaseMappings) {
        // check for mapping for start and end verses
        const startVerseMapping = findMappingByVerseId(startVerse, versificationMappings);
        const endVerseMapping = findMappingByVerseId(endVerse, versificationMappings);

        // for versification mappings:
        // ! any given VerseMapping.targetVerses in the mapping can be empty.
        // ! This represents an exclusion = source verse does not exist in target bible
        if (startVerseMapping) {
            if (startVerseMapping.targetVerses === null || startVerseMapping.targetVerses.length === 0) {
                // exclusion - this passage, or part of it, does not exist in target bible
                return null;
            } else {
                targetBibleStartVerseId = startVerseMapping.targetVerses[0]!.verseId;
            }
        }

        if (endVerseMapping) {
            if (endVerseMapping.targetVerses === null || endVerseMapping.targetVerses.length === 0) {
                // exclusion - this passage, or part of it, does not exist in target bible
                return null;
            } else {
                targetBibleEndVerseId = endVerseMapping.targetVerses.at(-1)!.verseId;
            }
        }

        // handle unexpected versification mapping data
        if (targetBibleStartVerseId > targetBibleEndVerseId) {
            log.exception(
                new Error(
                    `Unexpected versification mapping: sourceStartVerseId: ${startVerse}; sourceEndVerseId: ${endVerse}; targetBibleId: ${bibleId}; targetStartVerseId: ${targetBibleStartVerseId}; targetEndVerseId: ${targetBibleEndVerseId}; languageId: ${language.id}`
                )
            );
            return null;
        }
    }

    const targetBibleFullBooksText = await fetchBiblePassages(targetBibleStartVerseId, targetBibleEndVerseId, bibleId);
    if (!targetBibleFullBooksText || targetBibleFullBooksText.length === 0) {
        return null;
    }

    const targetBibleTextRange = getPassageContentFromBookTexts(
        targetBibleFullBooksText,
        parseVerseId(targetBibleStartVerseId),
        parseVerseId(targetBibleEndVerseId)
    );

    if (
        targetBibleTextRange.length === 0 ||
        targetBibleTextRange[0]!.chapters.length === 0 ||
        targetBibleTextRange[0]!.chapters[0]!.verses.length === 0
    ) {
        // no matching Bible text found
        return null;
    }

    const verseDisplayName = generateVerseReference(
        startVerse,
        endVerse,
        targetBibleTextRange,
        language,
        passageHasDifferentBaseMappings
    );
    const isSingleBook = targetBibleTextRange.length === 1;

    return {
        verseDisplayName,
        isSingleBook,
        isSingleChapter: isSingleBook && targetBibleTextRange[0]!.chapters.length === 1,
        bookTexts: targetBibleTextRange,
    };
};

export function generateVerseIdsForBookTexts(bibleTexts: BibleBookTexts): number[] {
    const passageVerseIds: number[] = [];
    const bookNumber = bibleTexts.bookNumber;

    bibleTexts.chapters.forEach((chapter: BibleBookChapters) => {
        chapter.verses.forEach((verse) => {
            passageVerseIds.push(
                parseInt(
                    generateVerseId({
                        bookId: bookNumber,
                        chapter: chapter.number,
                        verse: verse.number,
                    })
                )
            );
        });
    });

    return passageVerseIds;
}

function doesPassageHaveDifferentBaseMappings(
    startVerseId: number,
    endVerseId: number,
    versificationMappings: VerseMapping[] | null
): boolean {
    if (versificationMappings === null) {
        return false;
    }

    return versificationMappings.some(
        (v) => v.sourceVerse.verseId >= startVerseId && v.sourceVerse.verseId <= endVerseId
    );
}

function getPassageContentFromBookTexts(
    bookTexts: BibleBookTexts[],
    startVerse: Verse,
    endVerse: Verse
): BibleBookTexts[] {
    let passageContent: BibleBookTexts[] = bookTexts.filter(
        (b) =>
            b !== null && b.bookNumber <= startVerse.bookId && b.bookNumber >= endVerse.bookId && b.chapters.length > 0
    );

    for (let i = 0; i < passageContent.length; i++) {
        const book = passageContent[i]!;

        if (book.bookNumber === startVerse.bookId) {
            book.chapters = book.chapters.filter((c) => c.number >= startVerse.chapter);
        }

        if (book.bookNumber === endVerse.bookId) {
            book.chapters = book.chapters.filter((c) => c.number <= endVerse.chapter);
        }

        if (book.chapters.length > 0) {
            if (book.bookNumber === startVerse.bookId) {
                book.chapters[0]!.verses = book.chapters[0]!.verses.filter((v) => v.number >= startVerse.verse);
            }

            if (book.bookNumber === endVerse.bookId) {
                book.chapters.at(-1)!.verses = book.chapters.at(-1)!.verses.filter((v) => v.number <= endVerse.verse);
            }
        }

        // it's possible that all verses were filtered out of some chapters
        book.chapters = book.chapters.filter((c) => c.verses.length > 0);
    }

    // it's possible that all chapters were filtered out of some books
    passageContent = passageContent.filter((b) => b.chapters.length > 0);

    return passageContent;
}

function generateVerseReference(
    sourceBibleStartVerseId: number,
    sourceBibleEndVerseId: number,
    targetBibleTextRange: BibleBookTexts[],
    language: Language,
    hasDifferentMapping: boolean
): string {
    const targetBibleStartBook = targetBibleTextRange[0]!;
    const targetBibleStartChapterNumber = targetBibleTextRange[0]!.chapters[0]!.number;
    const targetBibleStartVerseNumber = targetBibleTextRange[0]!.chapters[0]!.verses[0]!.number;

    const targetBibleEndBook = targetBibleTextRange.at(-1)!;
    const targetBibleEndChapterNumber = targetBibleTextRange.at(-1)!.chapters.at(-1)!.number;
    const targetBibleEndVerseNumber = targetBibleTextRange.at(-1)!.chapters.at(-1)!.verses.at(-1)!.number;

    // Don't display mappings as different where the source verse range is 0-N and the target verse range is 1-N (where N >= 1) or vice-versa.
    // Because we hide verse 0 in the UI it doesn't make sense to display these as a different mapping.
    if (hasDifferentMapping) {
        const sourceBibleStartVerse = parseVerseId(sourceBibleStartVerseId);
        const sourceBibleEndVerse = parseVerseId(sourceBibleEndVerseId);

        if (
            targetBibleStartBook.bookNumber === sourceBibleStartVerse.bookId &&
            targetBibleStartChapterNumber === sourceBibleStartVerse.chapter &&
            ((targetBibleStartVerseNumber === 1 && sourceBibleStartVerse.verse === 0) ||
                (targetBibleStartVerseNumber === 0 && sourceBibleStartVerse.verse === 1)) &&
            targetBibleEndBook.bookNumber === sourceBibleEndVerse.bookId &&
            targetBibleEndChapterNumber === sourceBibleEndVerse.chapter &&
            targetBibleEndVerseNumber === sourceBibleEndVerse.verse
        ) {
            hasDifferentMapping = false;
        }
    }

    // if both 0 and verse 1 are requested we still only want to display a single reference to only verse 1
    if (
        targetBibleTextRange.length === 1 &&
        targetBibleTextRange[0]!.chapters.length === 1 &&
        targetBibleTextRange[0]!.chapters[0]!.verses.filter((v) => v.number !== 0).length === 1
    ) {
        return generateVerseFromReference(
            {
                verseId: 0,
                book: targetBibleStartBook.bookName,
                chapter: targetBibleStartChapterNumber,
                // purposely using the end verse number here to display verse 1 if verse 0 is also in the range
                verse: targetBibleEndVerseNumber,
            },
            language.scriptDirection,
            hasDifferentMapping
        );
    } else {
        return generateVerseFromReference(
            {
                startVerseId: 0,
                startBook: targetBibleStartBook.bookName,
                startChapter: targetBibleStartChapterNumber,
                startVerse: targetBibleStartVerseNumber,
                endVerseId: 0,
                endBook: targetBibleEndBook.bookName,
                endChapter: targetBibleEndChapterNumber,
                endVerse: targetBibleEndVerseNumber,
            },
            language.scriptDirection,
            hasDifferentMapping
        );
    }
}

function findMappingByVerseId(verseId: number, versificationMappings: VerseMapping[] | null): VerseMapping | undefined {
    return versificationMappings?.find((mapping) => mapping.sourceVerse.verseId === verseId);
}
