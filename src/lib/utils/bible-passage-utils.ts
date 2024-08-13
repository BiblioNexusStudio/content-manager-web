export interface Verse {
    bookId: number;
    chapter: number;
    verse: number;
}

export function parseVerseId(verseId: string) {
    return {
        bookId: Number(verseId.substring(1, 4)),
        chapter: Number(verseId.substring(4, 7)),
        verse: Number(verseId.substring(7, 10)),
    };
}

export function generateVerseId(verse: Verse) {
    return `1${verse.bookId.toString().padStart(3, '0')}${verse.chapter.toString().padStart(3, '0')}${verse.verse
        .toString()
        .padStart(3, '0')}`;
}
