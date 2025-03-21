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

    if (passageHasDifferentBaseMappings) {
        if (!hasMultipleVerses) {
            // if passage is single verse and we have base mapping, startVerseMapping will always be defined
            //! startVerseMapping.targetVerse can be null.
            //! This represents an exclusion = verse does not exist in target bible
            const startVerseMapping = findMappingByVerseId(startVerse, versificationMappings);
            if (startVerseMapping!.targetVerse === null) {
                // handle exclusion
                return null;
            }

            // does mapping exist in bookTexts?
            passageBookTexts = getSingleVersePassageContentFromBookTexts(bookTexts, {
                bookId: parseVerseId(startVerseMapping!.targetVerse.verseId).bookId,
                chapter: startVerseMapping!.targetVerse.chapter,
                verse: startVerseMapping!.targetVerse.verse,
            });

            if (passageBookTexts.length === 0) {
                //  if not, fetch according to mapping and set as bookTexts
                try {
                    passageBookTexts = await fetchBiblePassages(
                        startVerseMapping!.targetVerse.verseId,
                        startVerseMapping!.targetVerse.verseId,
                        language.id,
                        passedBibleId
                    );
                } catch (error) {
                    log.exception(
                        new Error(
                            `Error fetching mapped verses content - VerseId: ${
                                startVerseMapping!.targetVerse.verseId
                            } - Error: ${error}`
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

            verseDisplayName = generateSingleVerseDisplayName(passageBookTexts, language, true);
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
                if (startVerseMapping.targetVerse === null) {
                    // exclusion - this passage, or part of it, does not exist in target bible
                    return null;
                } else {
                    passageStartVerseId = startVerseMapping.targetVerse.verseId;
                }
            }

            if (endVerseMapping) {
                if (endVerseMapping.targetVerse === null) {
                    // exclusion - this passage, or part of it, does not exist in target bible
                    return null;
                } else {
                    passageEndVerseId = endVerseMapping.targetVerse.verseId;
                }
            }

            const parsedStartVerse = parseVerseId(passageStartVerseId);
            const parsedEndVerse = parseVerseId(passageEndVerseId);

            // does pasage exist in current bookTexts?
            passageBookTexts = getMultiVersePassageContentFromBookTexts(
                bookTexts,
                {
                    bookId: parsedStartVerse.bookId,
                    chapter: parsedStartVerse.chapter,
                    verse: parsedStartVerse.verse,
                },
                {
                    bookId: parsedEndVerse.bookId,
                    chapter: parsedEndVerse.chapter,
                    verse: parsedEndVerse.verse,
                }
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
