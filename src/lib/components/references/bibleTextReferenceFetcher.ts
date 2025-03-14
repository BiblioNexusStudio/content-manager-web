import { fetchBiblePassages } from '$lib/utils/bible-passage-fetcher';
import { generateVerseFromReference } from '$lib/utils/reference';
import type { BibleBookChapters, BibleBookTexts } from '$lib/utils/bible-book-fetcher';
import { log } from '$lib/logger';
import type { Language } from '$lib/types/base';
import { fetchBibleVersification } from '$lib/utils/bible-versification-fetcher';
import { generateVerseId, parseVerseId } from '$lib/utils/bible-passage-utils';

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
        fetchBibleVersification(startVerse, endVerse, passedBibleId),
    ]);

    if (!bookTexts || bookTexts.length === 0) {
        return null;
    }

    let verseDisplayName = '';
    const passageVerseIds = bookTexts.flatMap((bookText) => generateVerseIdsForBookTexts(bookText));

    const mappingVerseIdSet = new Set(
        versificationMappings?.map((mapping) => mapping.sourceVerse.verseId.toString()) || []
    );

    const passageHasDifferentBaseMappings = passageVerseIds.some((verseId) => mappingVerseIdSet.has(verseId));

    if (
        bookTexts.length === 1 &&
        bookTexts[0]?.chapters.length === 1 &&
        bookTexts[0]?.chapters[0]?.verses.length === 1
    ) {
        const singleVerseId = generateVerseId({
            bookId: bookTexts[0].bookNumber,
            chapter: bookTexts[0].chapters[0].number,
            verse: bookTexts[0].chapters[0].verses[0]!.number,
        });

        const verseMapping = versificationMappings?.find(
            (mapping) => mapping.sourceVerse.verseId.toString() === singleVerseId
        );

        if (verseMapping) {
            verseDisplayName = generateVerseFromReference(
                {
                    verseId: 0,
                    book: verseMapping.targetVerse.book,
                    chapter: verseMapping.targetVerse.chapter,
                    verse: verseMapping.targetVerse.verse,
                },
                language.scriptDirection,
                true
            );
        } else {
            verseDisplayName = generateVerseFromReference(
                {
                    verseId: 0,
                    book: bookTexts[0].bookName,
                    chapter: bookTexts[0].chapters[0].number,
                    verse: bookTexts[0].chapters[0].verses[0]!.number,
                },
                language.scriptDirection,
                passageHasDifferentBaseMappings
            );
        }
    } else {
        const passageStart = bookTexts[0]!;
        const passageEnd = bookTexts.at(-1)!;

        if (passageStart.chapters[0]?.verses[0] && passageEnd.chapters.at(-1)!.verses.at(-1)) {
            const startVerseId = generateVerseId({
                bookId: passageStart.bookNumber,
                chapter: passageStart.chapters[0]!.number,
                verse: passageStart.chapters[0]!.verses[0]!.number,
            });

            const endVerseId = generateVerseId({
                bookId: passageEnd.bookNumber,
                chapter: passageEnd.chapters.at(-1)!.number,
                verse: passageEnd.chapters.at(-1)!.verses.at(-1)!.number,
            });

            const startVerseMapping = versificationMappings?.find(
                (mapping) => mapping.sourceVerse.verseId.toString() === startVerseId
            );

            const endVerseMapping = versificationMappings?.find(
                (mapping) => mapping.sourceVerse.verseId.toString() === endVerseId
            );

            if (startVerseMapping && endVerseMapping) {
                verseDisplayName = generateVerseFromReference(
                    {
                        startVerseId: 0,
                        startBook: startVerseMapping.targetVerse.book,
                        startChapter: startVerseMapping.targetVerse.chapter,
                        startVerse: startVerseMapping.targetVerse.verse,
                        endVerseId: 0,
                        endBook: endVerseMapping.targetVerse.book,
                        endChapter: endVerseMapping.targetVerse.chapter,
                        endVerse: endVerseMapping.targetVerse.verse,
                    },
                    language.scriptDirection,
                    true
                );
            } else if (startVerseMapping) {
                verseDisplayName = generateVerseFromReference(
                    {
                        startVerseId: 0,
                        startBook: startVerseMapping.targetVerse.book,
                        startChapter: startVerseMapping.targetVerse.chapter,
                        startVerse: startVerseMapping.targetVerse.verse,
                        endVerseId: 0,
                        endBook: passageEnd.bookName,
                        endChapter: passageEnd.chapters.at(-1)!.number,
                        endVerse: passageEnd.chapters.at(-1)!.verses.at(-1)!.number,
                    },
                    language.scriptDirection,
                    true
                );
            } else if (endVerseMapping) {
                verseDisplayName = generateVerseFromReference(
                    {
                        startVerseId: 0,
                        startBook: passageStart.bookName,
                        startChapter: passageStart.chapters[0]!.number,
                        startVerse: passageStart.chapters[0]!.verses[0]!.number,
                        endVerseId: 0,
                        endBook: endVerseMapping.targetVerse.book,
                        endChapter: endVerseMapping.targetVerse.chapter,
                        endVerse: endVerseMapping.targetVerse.verse,
                    },
                    language.scriptDirection,
                    true
                );
            } else {
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
                    passageHasDifferentBaseMappings
                );
            }
        } else {
            // If the passage was not found in bookTexts, check if it exists in versification mappings
            // Example: Jonah 1:17 in LSB doesn't exist in bookTexts but maps to Jonah 2:1
            if (versificationMappings && versificationMappings.length > 0) {
                const hasMultipleVerses = startVerse !== endVerse;

                // For direct comparison with verse IDs in the mappings
                const parsedStartVerse = parseVerseId(startVerse);
                const parsedEndVerse = hasMultipleVerses ? parseVerseId(endVerse) : null;

                // Find mappings for the requested verses by matching chapter and verse
                const startVerseMap = versificationMappings.find(
                    (v) =>
                        v.sourceVerse.chapter === parsedStartVerse.chapter &&
                        v.sourceVerse.verse === parsedStartVerse.verse
                );

                if (!hasMultipleVerses && startVerseMap) {
                    // Single verse case - use the mapping if found
                    verseDisplayName = generateVerseFromReference(
                        {
                            verseId: 0,
                            book: startVerseMap.targetVerse.book,
                            chapter: startVerseMap.targetVerse.chapter,
                            verse: startVerseMap.targetVerse.verse,
                        },
                        language.scriptDirection,
                        true
                    );

                    // Fetch the content for the mapped verse
                    try {
                        const targetVerseId = startVerseMap.targetVerse.verseId;

                        const mappedBookTexts = await fetchBiblePassages(
                            targetVerseId,
                            targetVerseId,
                            language.id,
                            passedBibleId
                        );

                        if (mappedBookTexts && mappedBookTexts.length > 0) {
                            // Populate the bookTexts with the missing mapped content
                            return {
                                verseDisplayName,
                                isSingleBook: true,
                                isSingleChapter: mappedBookTexts[0]?.chapters.length === 1,
                                bookTexts: mappedBookTexts,
                            };
                        }
                    } catch (error) {
                        log.exception(
                            new Error(
                                `Error fetching mapped single verse content - VerseId: ${
                                    startVerseMap.targetVerse.verseId
                                } - Error:${error}`
                            )
                        );
                    }
                } else if (hasMultipleVerses && parsedEndVerse) {
                    // Multiple verses case
                    const endVerseMap = versificationMappings.find(
                        (v) =>
                            v.sourceVerse.chapter === parsedEndVerse.chapter &&
                            v.sourceVerse.verse === parsedEndVerse.verse
                    );

                    if (startVerseMap && endVerseMap) {
                        verseDisplayName = generateVerseFromReference(
                            {
                                startVerseId: 0,
                                startBook: startVerseMap.targetVerse.book,
                                startChapter: startVerseMap.targetVerse.chapter,
                                startVerse: startVerseMap.targetVerse.verse,
                                endVerseId: 0,
                                endBook: endVerseMap.targetVerse.book,
                                endChapter: endVerseMap.targetVerse.chapter,
                                endVerse: endVerseMap.targetVerse.verse,
                            },
                            language.scriptDirection,
                            true
                        );

                        // Fetch the content for the mapped verses
                        try {
                            const targetStartVerseId = startVerseMap.targetVerse.verseId;
                            const targetEndVerseId = endVerseMap.targetVerse.verseId;

                            const mappedBookTexts = await fetchBiblePassages(
                                targetStartVerseId,
                                targetEndVerseId,
                                language.id,
                                passedBibleId
                            );

                            if (mappedBookTexts && mappedBookTexts.length > 0) {
                                // Replace the original bookTexts with the mapped content
                                return {
                                    verseDisplayName,
                                    isSingleBook: mappedBookTexts.length === 1,
                                    isSingleChapter:
                                        mappedBookTexts.length === 1 && mappedBookTexts[0]?.chapters.length === 1,
                                    bookTexts: mappedBookTexts,
                                };
                            }
                        } catch (error) {
                            log.exception(
                                new Error(
                                    `Error fetching mapped verses content - startVerseId: ${
                                        startVerseMap.targetVerse.verseId
                                    } - endVerseId: ${endVerseMap.targetVerse.verseId} - Error: ${error}`
                                )
                            );
                        }
                    }
                }

                // If we still don't have a verse display name after checking mappings, log an error
                if (!verseDisplayName) {
                    log.exception(
                        new Error(
                            `Unexpected issue while building verse display name. startVerse: ${startVerse} endVerse: ${endVerse} languageId: ${
                                language.id
                            } bookTextsStart: ${bookTextDebugInfo(passageStart)} bookTextsEnd: ${bookTextDebugInfo(passageEnd)}`
                        )
                    );
                }
            }
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

export function generateVerseIdsForBookTexts(bibleTexts: BibleBookTexts) {
    const passageVerseIds: string[] = [];
    const bookNumber = bibleTexts.bookNumber;

    bibleTexts.chapters.forEach((chapter: BibleBookChapters) => {
        chapter.verses.forEach((verse) => {
            passageVerseIds.push(
                generateVerseId({
                    bookId: bookNumber,
                    chapter: chapter.number,
                    verse: verse.number,
                })
            );
        });
    });

    return passageVerseIds;
}
