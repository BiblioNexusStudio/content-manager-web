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
        versificationMappings?.map((mapping) => mapping.sourceBibleVerse.verseId.toString()) || []
    );

    const passageHasDifferentBaseMappings = passageVerseIds.some((verseId) => mappingVerseIdSet.has(verseId));

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
            passageHasDifferentBaseMappings
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
                passageHasDifferentBaseMappings
            );
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
                        v.sourceBibleVerse.chapter === parsedStartVerse.chapter &&
                        v.sourceBibleVerse.verse === parsedStartVerse.verse
                );

                if (!hasMultipleVerses && startVerseMap) {
                    // Single verse case - use the mapping if found
                    verseDisplayName = generateVerseFromReference(
                        {
                            verseId: 0,
                            book: startVerseMap.targetBibleVerse.book,
                            chapter: startVerseMap.targetBibleVerse.chapter,
                            verse: startVerseMap.targetBibleVerse.verse,
                        },
                        language.scriptDirection,
                        true // If we found a mapping, there is definitely a versification difference
                    );

                    // Fetch the content for the mapped verse
                    try {
                        const targetVerseId = startVerseMap.targetBibleVerse.verseId;

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
                                    startVerseMap.targetBibleVerse.verseId
                                } - Error:${error}`
                            )
                        );
                    }
                } else if (hasMultipleVerses && parsedEndVerse) {
                    // Multiple verses case
                    const endVerseMap = versificationMappings.find(
                        (v) =>
                            v.sourceBibleVerse.chapter === parsedEndVerse.chapter &&
                            v.sourceBibleVerse.verse === parsedEndVerse.verse
                    );

                    if (startVerseMap && endVerseMap) {
                        verseDisplayName = generateVerseFromReference(
                            {
                                startVerseId: 0,
                                startBook: startVerseMap.targetBibleVerse.book,
                                startChapter: startVerseMap.targetBibleVerse.chapter,
                                startVerse: startVerseMap.targetBibleVerse.verse,
                                endVerseId: 0,
                                endBook: endVerseMap.targetBibleVerse.book,
                                endChapter: endVerseMap.targetBibleVerse.chapter,
                                endVerse: endVerseMap.targetBibleVerse.verse,
                            },
                            language.scriptDirection,
                            true // If we found mappings, there is definitely a versification difference
                        );

                        // Fetch the content for the mapped verses
                        try {
                            const targetStartVerseId = startVerseMap.targetBibleVerse.verseId;
                            const targetEndVerseId = endVerseMap.targetBibleVerse.verseId;

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
                                        startVerseMap.targetBibleVerse.verseId
                                    } - endVerseId: ${endVerseMap.targetBibleVerse.verseId} - Error: ${error}`
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
