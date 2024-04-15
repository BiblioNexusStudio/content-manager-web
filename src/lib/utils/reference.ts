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

export function generateVerseFromReference(reference: PassageReference | VerseReference): string {
    let label: string;
    if (instanceOfPassageReference(reference)) {
        if (reference.startBook === reference.endBook) {
            if (reference.startChapter === reference.endChapter) {
                label = `${reference.startBook} ${reference.startChapter}:${reference.startVerse}-${reference.endVerse}`;
            } else {
                label = `${reference.startBook} ${reference.startChapter}:${reference.startVerse}-${reference.endChapter}:${reference.endVerse}`;
            }
        } else {
            label = `${reference.startBook} ${reference.startChapter}:${reference.startVerse} - ${reference.endBook} ${reference.endChapter}:${reference.endVerse}`;
        }
    } else {
        label = `${reference.book} ${reference.chapter}:${reference.verse}`;
    }

    return label;
}
