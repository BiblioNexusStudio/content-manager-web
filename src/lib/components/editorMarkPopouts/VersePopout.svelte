<script lang="ts">
    import { onMount } from 'svelte';
    import MarkPopout from '$lib/components/editorMarkPopouts/MarkPopout.svelte';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { fetchBiblePassage, type Verse } from '$lib/utils/bible-passage-fetcher';
    import { type BibleBooksResponse, fetchBibleBooks } from '$lib/utils/bible-book-fetcher';
    import { generateVerseFromReference } from '$lib/utils/reference';

    let markSpan: HTMLElement | null;
    let show = false;
    let bubblingClick = false;
    let fetchPromises: Promise<{ verses: Verse[]; book: BibleBooksResponse | null }>;
    let verseDisplayName = '';

    const fetch = async (bookId: number, startVerse: string, endVerse: string) => {
        const passagePromise = fetchBiblePassage(startVerse, endVerse);
        const booksPromise = fetchBibleBooks(bookId);

        const promises = await Promise.all([passagePromise, booksPromise]);
        const response = {
            verses: promises[0],
            book: promises[1],
        };

        if (response.verses.length == 1) {
            const verse = response.verses[0];
            verseDisplayName = generateVerseFromReference({
                verseId: 0,
                book: response.book!.name,
                chapter: verse!.chapterNumber,
                verse: verse!.verseNumber,
            });
        } else if (response.verses.length > 1) {
            const startVerse = response.verses[0];
            const endVerse = response.verses.at(-1);
            verseDisplayName = generateVerseFromReference({
                startVerseId: 0,
                startBook: response.book!.name,
                startChapter: startVerse!.chapterNumber,
                startVerse: startVerse!.verseNumber,
                endVerseId: 0,
                endBook: response.book!.name,
                endChapter: endVerse!.chapterNumber,
                endVerse: endVerse!.verseNumber,
            });
        }

        return response;
    };

    onMount(() => {
        window.onBibleReferenceClick = (spanId, startVerse, endVerse) => {
            const bookId = Number(startVerse.substring(1, 4));
            fetchPromises = fetch(bookId, startVerse, endVerse);

            markSpan = document.getElementById(spanId);
            show = true;
            bubblingClick = true;
        };
    });

    const onAnyClick = () => {
        if (bubblingClick) {
            bubblingClick = false;
            return;
        }

        show = false;
    };
</script>

<svelte:window on:click={onAnyClick} />

<MarkPopout bind:show bind:markSpan>
    <div class="overflow-y-auto">
        <div class="m-4 flex min-h-[64px] flex-col justify-center space-y-2">
            {#await fetchPromises}
                <CenteredSpinner />
            {:then promise}
                <div class="mb-2 font-semibold">{verseDisplayName}</div>
                {#each promise.verses as verse (verse)}
                    <div><sup class="font-bold">{verse.verseNumber}</sup> {verse.text}</div>
                {/each}
            {/await}
        </div>
    </div>
</MarkPopout>
