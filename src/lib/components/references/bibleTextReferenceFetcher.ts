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

interface VerseReferenceData {
    book: string;
    chapter: number;
    verse: number;
    verseId?: number;
}

interface VerseRangeReferenceData {
    startBook: string;
    startChapter: number;
    startVerse: number;
    startVerseId?: number;
    endBook: string;
    endChapter: number;
    endVerse: number;
    endVerseId?: number;
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

    const findMappingByVerseId = (verseId: string) => {
        return versificationMappings?.find((mapping) => mapping.sourceVerse.verseId.toString() === verseId);
    };

    const generateVerseIdFromBookText = (bookNumber: number, chapter: number, verse: number): string => {
        return generateVerseId({
            bookId: bookNumber,
            chapter,
            verse,
        });
    };

    const generateSingleVerseDisplayName = (verseData: VerseReferenceData, hasDifferentMapping: boolean): string => {
        return generateVerseFromReference(
            {
                verseId: 0,
                book: verseData.book,
                chapter: verseData.chapter,
                verse: verseData.verse,
            },
            language.scriptDirection,
            hasDifferentMapping
        );
    };

    const generateVerseRangeDisplayName = (
        rangeData: VerseRangeReferenceData,
        hasDifferentMapping: boolean
    ): string => {
        return generateVerseFromReference(
            {
                startVerseId: 0,
                startBook: rangeData.startBook,
                startChapter: rangeData.startChapter,
                startVerse: rangeData.startVerse,
                endVerseId: 0,
                endBook: rangeData.endBook,
                endChapter: rangeData.endChapter,
                endVerse: rangeData.endVerse,
            },
            language.scriptDirection,
            hasDifferentMapping
        );
    };

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
        // Single verse case
        const singleBookText = bookTexts[0]!;
        const singleChapter = singleBookText.chapters[0]!;
        const singleVerse = singleChapter.verses[0]!;

        const singleVerseId = generateVerseIdFromBookText(
            singleBookText.bookNumber,
            singleChapter.number,
            singleVerse.number
        );

        const verseMapping = findMappingByVerseId(singleVerseId);

        if (verseMapping) {
            verseDisplayName = generateSingleVerseDisplayName(
                {
                    book: verseMapping.targetVerse.book,
                    chapter: verseMapping.targetVerse.chapter,
                    verse: verseMapping.targetVerse.verse,
                },
                true
            );

            bookTexts[0]!.chapters[0]!.verses[0]!.number = verseMapping.targetVerse.verse;
        } else {
            verseDisplayName = generateSingleVerseDisplayName(
                {
                    book: singleBookText.bookName,
                    chapter: singleChapter.number,
                    verse: singleVerse.number,
                },
                passageHasDifferentBaseMappings
            );
        }
    } else {
        const passageStart = bookTexts[0]!;
        const passageEnd = bookTexts.at(-1)!;

        if (passageStart.chapters[0]?.verses[0] && passageEnd.chapters.at(-1)!.verses.at(-1)) {
            const startChapter = passageStart.chapters[0]!;
            const startVerse = startChapter.verses[0]!;
            const endChapter = passageEnd.chapters.at(-1)!;
            const endVerse = endChapter.verses.at(-1)!;

            const startVerseId = generateVerseIdFromBookText(
                passageStart.bookNumber,
                startChapter.number,
                startVerse.number
            );

            const endVerseId = generateVerseIdFromBookText(passageEnd.bookNumber, endChapter.number, endVerse.number);

            const startVerseMapping = findMappingByVerseId(startVerseId);
            const endVerseMapping = findMappingByVerseId(endVerseId);

            const rangeData: VerseRangeReferenceData = {
                startBook: startVerseMapping ? startVerseMapping.targetVerse.book : passageStart.bookName,
                startChapter: startVerseMapping ? startVerseMapping.targetVerse.chapter : startChapter.number,
                startVerse: startVerseMapping ? startVerseMapping.targetVerse.verse : startVerse.number,
                endBook: endVerseMapping ? endVerseMapping.targetVerse.book : passageEnd.bookName,
                endChapter: endVerseMapping ? endVerseMapping.targetVerse.chapter : endChapter.number,
                endVerse: endVerseMapping ? endVerseMapping.targetVerse.verse : endVerse.number,
            };

            const hasDifferentMapping = !!(startVerseMapping || endVerseMapping) || passageHasDifferentBaseMappings;
            verseDisplayName = generateVerseRangeDisplayName(rangeData, hasDifferentMapping);

            if (startVerseMapping) {
                passageStart.chapters[0]!.verses[0]!.number = startVerseMapping.targetVerse.verse;
            }

            if (endVerseMapping) {
                passageEnd.chapters.at(-1)!.verses.at(-1)!.number = endVerseMapping.targetVerse.verse;
            }
        } else {
            if (versificationMappings && versificationMappings.length > 0) {
                const hasMultipleVerses = startVerse !== endVerse;

                const parsedStartVerse = parseVerseId(startVerse);
                const parsedEndVerse = hasMultipleVerses ? parseVerseId(endVerse) : null;

                const startVerseMap = versificationMappings.find(
                    (v) =>
                        v.sourceVerse.chapter === parsedStartVerse.chapter &&
                        v.sourceVerse.verse === parsedStartVerse.verse
                );

                if (!hasMultipleVerses && startVerseMap) {
                    verseDisplayName = generateSingleVerseDisplayName(
                        {
                            book: startVerseMap.targetVerse.book,
                            chapter: startVerseMap.targetVerse.chapter,
                            verse: startVerseMap.targetVerse.verse,
                        },
                        true
                    );

                    try {
                        const targetVerseId = startVerseMap.targetVerse.verseId;

                        const mappedBookTexts = await fetchBiblePassages(
                            targetVerseId,
                            targetVerseId,
                            language.id,
                            passedBibleId
                        );

                        if (mappedBookTexts && mappedBookTexts.length > 0) {
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
                    const endVerseMap = versificationMappings.find(
                        (v) =>
                            v.sourceVerse.chapter === parsedEndVerse.chapter &&
                            v.sourceVerse.verse === parsedEndVerse.verse
                    );

                    if (startVerseMap && endVerseMap) {
                        verseDisplayName = generateVerseRangeDisplayName(
                            {
                                startBook: startVerseMap.targetVerse.book,
                                startChapter: startVerseMap.targetVerse.chapter,
                                startVerse: startVerseMap.targetVerse.verse,
                                endBook: endVerseMap.targetVerse.book,
                                endChapter: endVerseMap.targetVerse.chapter,
                                endVerse: endVerseMap.targetVerse.verse,
                            },
                            true
                        );

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
