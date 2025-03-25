import { fetchBiblePassages } from '$lib/utils/bible-passage-fetcher';
import { generateVerseFromReference } from '$lib/utils/reference';
import type { BibleBookChapters, BibleBookTexts } from '$lib/utils/bible-book-fetcher';
import { log } from '$lib/logger';
import type { Language } from '$lib/types/base';
import { fetchBibleVersification, type VerseMapping } from '$lib/utils/bible-versification-fetcher';
import { generateVerseId, parseVerseId, type Verse } from '$lib/utils/bible-passage-utils';

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
    // ensure we always include verse 0 along with verse 1 if verse 0 exists
    if (startVerse % 1000 === 1) {
        startVerse -= 1;
    }

    const [bookTexts, versificationMappings] = await Promise.all([
        fetchBiblePassages(startVerse, endVerse, language.id, passedBibleId),
        fetchBibleVersification(startVerse, endVerse, language.id, passedBibleId),
    ]);

    if (!bookTexts || bookTexts.length === 0) {
        return null;
    }

    // --- return values ---
    let verseDisplayName = '';
    let passageBookTexts: BibleBookTexts[] = [];

    const passageHasDifferentBaseMappings = doesPassageHaveDifferentBaseMappings(
        startVerse,
        endVerse,
        versificationMappings
    );

    // --- prepare start and end passage verses ---
    const hasMultipleVerses = startVerse !== endVerse;
    const parsedStartVerse = parseVerseId(startVerse);
    const parsedEndVerse = hasMultipleVerses ? parseVerseId(endVerse) : null;

    // This logic assumes that all returned mappings are an exact range in the target Bible.  This is not necessarily true but is easier to reason about.
    // In the future we may need to update this logic to handle more complex mappings if real-world scenarios arise where mappings are non-consecutive verses.
    if (passageHasDifferentBaseMappings) {
        if (!hasMultipleVerses) {
            // if passage is single verse and we have base mapping, startVerseMapping will always be defined
            //! startVerseMapping.targetVerse can be null.
            //! This represents an exclusion = verse does not exist in target Bible
            const startVerseMapping = findMappingByVerseId(startVerse, versificationMappings);
            if (startVerseMapping!.targetVerses === null || startVerseMapping!.targetVerses.length === 0) {
                // handle exclusion
                return null;
            }

            // does mapping exist in bookTexts?
            passageBookTexts = getMultiVersePassageContentFromBookTexts(
                bookTexts,
                parseVerseId(startVerseMapping!.targetVerses[0]!.verseId),
                parseVerseId(startVerseMapping!.targetVerses.at(-1)!.verseId)
            );

            if (passageBookTexts.length === 0) {
                //  if not, fetch according to mapping and set as bookTexts
                try {
                    passageBookTexts = await fetchBiblePassages(
                        startVerseMapping!.targetVerses[0]!.verseId,
                        startVerseMapping!.targetVerses.at(-1)!.verseId,
                        language.id,
                        passedBibleId
                    );
                } catch (error) {
                    log.exception(
                        new Error(
                            `Error fetching mapped verses content - StartVerseId: ${
                                startVerseMapping!.targetVerses[0]!.verseId
                            } - EndVerseId: ${startVerseMapping!.targetVerses.at(-1)!.verseId} - Error: ${error}`
                        )
                    );
                    return null;
                }

                // now, if we do not have content, we should return null and throw error
                if (passageBookTexts.length === 0) {
                    logUnexpectedError(bookTexts, startVerse, endVerse, language);
                    return null;
                }
            }

            verseDisplayName =
                startVerseMapping!.targetVerses.length === 1
                    ? generateSingleVerseDisplayName(passageBookTexts, language, true)
                    : generateVerseRangeDisplayName(passageBookTexts, language, true);
        } else {
            // multiple vers passage with at least some mappings
            // ! any given VerseMapping.targetVerse in the mapping can be null.
            // ! This represents an exclusion = verse does not exist in target bible

            // check for mapping for start and end verses
            const startVerseMapping = findMappingByVerseId(startVerse, versificationMappings);
            const endVerseMapping = findMappingByVerseId(endVerse, versificationMappings);
            let passageStartVerseId = startVerse;
            let passageEndVerseId = endVerse;

            if (startVerseMapping) {
                if (startVerseMapping.targetVerses === null || startVerseMapping.targetVerses.length === 0) {
                    // exclusion - this passage, or part of it, does not exist in target bible
                    return null;
                } else {
                    passageStartVerseId = startVerseMapping.targetVerses[0]!.verseId;
                }
            }

            if (endVerseMapping) {
                if (endVerseMapping.targetVerses === null || endVerseMapping.targetVerses.length === 0) {
                    // exclusion - this passage, or part of it, does not exist in target bible
                    return null;
                } else {
                    passageEndVerseId = endVerseMapping.targetVerses.at(-1)!.verseId;
                }
            }

            // does passage exist in current bookTexts?
            passageBookTexts = getMultiVersePassageContentFromBookTexts(
                bookTexts,
                parseVerseId(passageStartVerseId),
                parseVerseId(passageEndVerseId)
            );

            // if not, fetch passage content according to new start and end and set as bookTexts
            if (passageBookTexts.length === 0) {
                try {
                    passageBookTexts = await fetchBiblePassages(
                        passageStartVerseId,
                        passageEndVerseId,
                        language.id,
                        passedBibleId
                    );
                } catch (error) {
                    log.exception(
                        new Error(
                            `Error fetching mapped verses content - start VerseId: ${
                                passageStartVerseId
                            } - to VerseId: ${passageEndVerseId} - Error: ${error}`
                        )
                    );
                    return null;
                }

                // now, if we do not have content, we should return null and throw error
                if (passageBookTexts.length === 0) {
                    logUnexpectedError(bookTexts, passageStartVerseId, passageEndVerseId, language);
                    return null;
                }
            }

            verseDisplayName = generateVerseRangeDisplayName(passageBookTexts, language, true);
        }
    } else {
        // if passage has no mapping, passage perfectly aligned
        if (!hasMultipleVerses) {
            passageBookTexts = getSingleVersePassageContentFromBookTexts(bookTexts, parsedStartVerse);

            if (passageBookTexts.length === 0) {
                logUnexpectedError(bookTexts, startVerse, endVerse, language);
                return null;
            }

            verseDisplayName = generateSingleVerseDisplayName(passageBookTexts, language, false);
        } else {
            passageBookTexts = getMultiVersePassageContentFromBookTexts(bookTexts, parsedStartVerse, parsedEndVerse!);

            if (passageBookTexts.length === 0) {
                logUnexpectedError(bookTexts, startVerse, endVerse, language);
                return null;
            }

            verseDisplayName = generateVerseRangeDisplayName(passageBookTexts, language, false);
        }
    }

    const isSingleBook = passageBookTexts.length === 1;

    return {
        verseDisplayName,
        isSingleBook,
        isSingleChapter: isSingleBook && passageBookTexts[0]!.chapters.length === 1,
        bookTexts: passageBookTexts,
    };
};

function bookTextDebugInfo(book: BibleBookTexts | undefined) {
    return JSON.stringify(
        book?.chapters.map((c) => ({ numberAndVerses: `${c.number}-${JSON.stringify(c.verses.map((v) => v.number))}` }))
    );
}

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

    if (startVerseId === endVerseId) {
        return !!versificationMappings.find((v) => v.sourceVerse.verseId === startVerseId);
    }

    return versificationMappings.some(
        (v) => v.sourceVerse.verseId >= startVerseId && v.sourceVerse.verseId <= endVerseId
    );
}

function getSingleVersePassageContentFromBookTexts(bookTexts: BibleBookTexts[], startVerse: Verse): BibleBookTexts[] {
    const passageContent: BibleBookTexts[] = [];

    passageContent.push(bookTexts[0]!);

    passageContent[0]!.chapters = bookTexts[0]!.chapters.filter((b) => b.number === startVerse.chapter);
    passageContent[0]!.chapters[0]!.verses = bookTexts[0]!.chapters[0]!.verses.filter(
        (v) => v.number === startVerse.verse
    );

    return passageContent;
}

function getMultiVersePassageContentFromBookTexts(
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

function generateSingleVerseDisplayName(
    bookTexts: BibleBookTexts[],
    language: Language,
    hasDifferentMapping: boolean
): string {
    const singleBookText = bookTexts[0]!;
    const singleChapter = singleBookText.chapters[0]!;
    const singleVerse = singleChapter.verses[0]!;

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
}

function generateVerseRangeDisplayName(
    bookTexts: BibleBookTexts[],
    language: Language,
    hasDifferentMapping: boolean
): string {
    return generateVerseFromReference(
        {
            startVerseId: 0,
            startBook: bookTexts[0]!.bookName,
            startChapter: bookTexts[0]!.chapters[0]!.number,
            startVerse: bookTexts[0]!.chapters[0]!.verses[0]!.number,
            endVerseId: 0,
            endBook: bookTexts.at(-1)!.bookName,
            endChapter: bookTexts.at(-1)!.chapters.at(-1)!.number,
            endVerse: bookTexts.at(-1)!.chapters.at(-1)!.verses.at(-1)!.number,
        },
        language.scriptDirection,
        hasDifferentMapping
    );
}

function findMappingByVerseId(verseId: number, versificationMappings: VerseMapping[] | null): VerseMapping | undefined {
    return versificationMappings?.find((mapping) => mapping.sourceVerse.verseId === verseId);
}

function logUnexpectedError(
    bookTexts: BibleBookTexts[],
    startVerse: number,
    endVerse: number,
    language: Language
): void {
    log.exception(
        new Error(
            `Unexpected issue while building verse display name. startVerse: ${startVerse} endVerse: ${endVerse} languageId: ${
                language.id
            } bookTextsStart: ${bookTextDebugInfo(bookTexts[0])} bookTextsEnd: ${bookTextDebugInfo(bookTexts.at(-1))}`
        )
    );
}
