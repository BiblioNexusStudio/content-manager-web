import type { PassageReference, ResourceContent, VerseReference } from '$lib/types/resources';

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
