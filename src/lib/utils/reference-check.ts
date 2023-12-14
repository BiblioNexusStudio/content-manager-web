import type { PassageReference, VerseReference } from '$lib/types/resources';

export function instanceOfPassageReference(object: PassageReference | VerseReference): object is PassageReference {
    return 'startVerseId' in object;
}
