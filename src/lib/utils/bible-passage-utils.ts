export interface Verse {
    bookId: number;
    chapter: number;
    verse: number;
}

export function parseVerseId(verseId: number) {
    const verseString = verseId.toString();
    return {
        bookId: Number(verseString.substring(1, 4)),
        chapter: Number(verseString.substring(4, 7)),
        verse: Number(verseString.substring(7, 10)),
    };
}

export function generateVerseId(verse: Verse) {
    return `1${verse.bookId.toString().padStart(3, '0')}${verse.chapter.toString().padStart(3, '0')}${verse.verse
        .toString()
        .padStart(3, '0')}`;
}
