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
    const passageContent: BibleBookTexts[] = bookTexts;

    passageContent.filter((b) => b.bookNumber <= startVerse.bookId && b.bookNumber >= endVerse!.bookId);
    for (let i = 0; i < passageContent.length; i++) {
        passageContent[i]!.chapters = passageContent[i]!.chapters.filter(
            (b) => b.number >= startVerse.chapter && b.number <= endVerse.chapter
        );
        passageContent[i]!.chapters[0]!.verses = passageContent[i]!.chapters[0]!.verses.filter(
            (v) => v.number >= startVerse.verse
        );
        passageContent[i]!.chapters.at(-1)!.verses = passageContent[i]!.chapters.at(-1)!.verses.filter(
            (v) => v.number <= endVerse.verse
        );
    }

    return passageContent;
}

function generateVerseReference(
    sourceBibleStartVerseId: number,
    sourceBibleEndVerseId: number,
    targetBibleTextRange: BibleBookTexts[],
    language: Language,
    hasDifferentMapping: boolean
): string {
    // if both 0 and verse 1 are requested we still only want to display a single reference to only verse 1
    if (
        targetBibleTextRange.length === 1 &&
        targetBibleTextRange[0]!.chapters.length === 1 &&
        targetBibleTextRange[0]!.chapters[0]!.verses.filter((v) => v.number !== 0).length === 1
    ) {
        const singleBookText = targetBibleTextRange[0]!;
        const singleChapter = singleBookText.chapters[0]!;
        const singleVerse = singleChapter.verses.at(-1)!;

        // there's one mapping that we don't want to display as different: where the source verse range is 0-1 and the target verse is 1
        if (hasDifferentMapping) {
            const parsedStartVerse = parseVerseId(sourceBibleStartVerseId);
            const parsedEndVerse = parseVerseId(sourceBibleEndVerseId);

            if (
                parsedStartVerse.verse === 0 &&
                parsedEndVerse.verse === 1 &&
                parsedStartVerse.bookId === parsedEndVerse.bookId &&
                parsedStartVerse.chapter === parsedEndVerse.chapter &&
                singleBookText.bookNumber === parsedStartVerse.bookId &&
                singleChapter.number === parsedStartVerse.chapter &&
                singleVerse.number === parsedEndVerse.verse
            ) {
                hasDifferentMapping = false;
            }
        }

        return generateVerseFromReference(
            {
                verseId: 0,
                book: singleBookText.bookName,
                chapter: singleChapter.number,
                verse: singleVerse.number,
            },
            language.scriptDirection,
            hasDifferentMapping
        );
    } else {
        return generateVerseFromReference(
            {
                startVerseId: 0,
                startBook: targetBibleTextRange[0]!.bookName,
                startChapter: targetBibleTextRange[0]!.chapters[0]!.number,
                startVerse: targetBibleTextRange[0]!.chapters[0]!.verses[0]!.number,
                endVerseId: 0,
                endBook: targetBibleTextRange.at(-1)!.bookName,
                endChapter: targetBibleTextRange.at(-1)!.chapters.at(-1)!.number,
                endVerse: targetBibleTextRange.at(-1)!.chapters.at(-1)!.verses.at(-1)!.number,
            },
            language.scriptDirection,
            hasDifferentMapping
        );
    }
}

function findMappingByVerseId(verseId: number, versificationMappings: VerseMapping[] | null): VerseMapping | undefined {
    return versificationMappings?.find((mapping) => mapping.sourceVerse.verseId === verseId);
}
