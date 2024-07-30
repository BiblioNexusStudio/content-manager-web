import { ScriptDirection } from '$lib/types/base';
import type { PassageReference, ResourceContent, VerseReference } from '$lib/types/resources';

export const tinySpace = '\u200A';

export function instanceOfPassageReference(object: PassageReference | VerseReference): object is PassageReference {
    return 'startVerseId' in object;
}

export function getSortedReferences(resourceContent: ResourceContent) {
    return [...resourceContent.passageReferences, ...resourceContent.verseReferences].sort((refA, refB) => {
        if (instanceOfPassageReference(refA)) {
            if (instanceOfPassageReference(refB)) {
                return refA.startVerseId - refB.startVerseId;
            } else {
                return refA.startVerseId - refB.verseId;
            }
        } else {
            if (instanceOfPassageReference(refB)) {
                return refA.verseId - refB.startVerseId;
            } else {
                return refA.verseId - refB.verseId;
            }
        }
    });
}

export function generateVerseFromReference(
    reference: PassageReference | VerseReference,
    scriptDirection: ScriptDirection
): string {
    // This code is necessary to update Tiptap content that contains Bible verse references in RTL languages
    // like Arabic. It makes sure that a reference like Luke 12:17 shows up as 17:12 Luke instead of 12:17 Luke.
    // It inserts tiny spaces into the content that are almost invisible to humans but the RTL browser handling
    // notices it and formats things correctly.
    const rtlSpace = scriptDirection === ScriptDirection.RTL ? tinySpace : '';

    let label: string;
    if (instanceOfPassageReference(reference)) {
        if (reference.startBook === reference.endBook) {
            if (reference.startChapter === reference.endChapter) {
                label = `${reference.startBook} ${reference.startChapter}${rtlSpace}:${rtlSpace}${reference.startVerse}-${reference.endVerse}`;
            } else {
                label = `${reference.startBook} ${reference.startChapter}${rtlSpace}:${rtlSpace}${reference.startVerse}-${reference.endChapter}${rtlSpace}:${rtlSpace}${reference.endVerse}`;
            }
        } else {
            label = `${reference.startBook} ${reference.startChapter}${rtlSpace}:${rtlSpace}${reference.startVerse} - ${reference.endBook} ${reference.endChapter}${rtlSpace}:${rtlSpace}${reference.endVerse}`;
        }
    } else {
        label = `${reference.book} ${reference.chapter}${rtlSpace}:${rtlSpace}${reference.verse}`;
    }

    return label;
}

// This takes JSON Tiptap and strips out the RTL verse reference 'spaces' that were used to make the browser display correctly.
export function stripOutRtlVerseReferenceMarkers(json: object) {
    const jsonString = JSON.stringify(json);
    const regex = new RegExp(`(\\d+)${tinySpace}:${tinySpace}(\\d+)`, 'g');
    const updatedString = jsonString.replace(regex, '$1:$2');
    return JSON.parse(updatedString);
}
