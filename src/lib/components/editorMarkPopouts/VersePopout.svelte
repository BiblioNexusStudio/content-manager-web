<script lang="ts">
    import { onMount } from 'svelte';
    import MarkPopout from '$lib/components/editorMarkPopouts/MarkPopout.svelte';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { fetchBiblePassages, type BibleText } from '$lib/utils/bible-passage-fetcher';
    import { generateVerseFromReference } from '$lib/utils/reference';

    export let languageId: number;

    let markSpan: HTMLElement | null;
    let show = false;
    let container: HTMLDivElement | undefined;
    let bubblingClick = false;
    let bibleTexts: BibleText[] | undefined;
    let verseDisplayName = '';
    let singleChapter = true;
    let singleBook = true;
    let failedFetch = false;

    const fetch = async (startVerse: string, endVerse: string) => {
        const bookTexts = await fetchBiblePassages(startVerse, endVerse, languageId);

        if (!bookTexts || bookTexts.length === 0) {
            failedFetch = true;
            return;
        }

        if (
            bookTexts.length === 1 &&
            bookTexts[0]?.chapters.length === 1 &&
            bookTexts[0]?.chapters[0]?.verses.length === 1
        ) {
            verseDisplayName = generateVerseFromReference({
                verseId: 0,
                book: bookTexts[0].bookName,
                chapter: bookTexts[0].chapters[0].number,
                verse: bookTexts[0].chapters[0].verses[0]!.number,
            });
        } else {
            const passageStart = bookTexts[0]!;
            const passageEnd = bookTexts.at(-1)!;

            verseDisplayName = generateVerseFromReference({
                startVerseId: 0,
                startBook: passageStart.bookName,
                startChapter: passageStart.chapters[0]!.number,
                startVerse: passageStart.chapters[0]!.verses[0]!.number,
                endVerseId: 0,
                endBook: passageEnd.bookName,
                endChapter: passageEnd.chapters.at(-1)!.number,
                endVerse: passageEnd.chapters.at(-1)!.verses.at(-1)!.number,
            });
        }

        singleBook = bookTexts.length === 1;
        singleChapter = singleBook && bookTexts[0]!.chapters.length === 1;

        return bookTexts;
    };

    onMount(() => {
        window.onBibleReferenceClick = async (spanId, startVerse, endVerse) => {
            bubblingClick = true;
            bibleTexts = undefined;
            show = true;
            markSpan = document.getElementById(spanId);

            bibleTexts = await fetch(startVerse, endVerse);
        };
    });

    const onAnyClick = (e: MouseEvent) => {
        if (bubblingClick) {
            bubblingClick = false;
            return;
        }

        if (container) {
            show = container.contains(e.target as Node);
        }
    };
</script>

<svelte:window on:click={onAnyClick} />

{#if bibleTexts}
    <MarkPopout bind:show bind:markSpan bind:container>
        <div class="overflow-y-auto" dir="auto">
            <div class="m-4 flex flex-col justify-center space-y-2">
                <div class="mb-2 font-semibold">{verseDisplayName}</div>
                {#each bibleTexts as text (text)}
                    {#if !singleBook}
                        <div class="font-semibold">{text.bookName}</div>
                    {/if}
                    {#each text.chapters as chapter (chapter)}
                        {#if !singleChapter}
                            <div class="font-semibold">Chapter {chapter.number}</div>
                        {/if}
                        {#each chapter.verses as verse (verse)}
                            <div><sup class="font-bold">{verse.number}</sup> {verse.text}</div>
                        {/each}
                    {/each}
                {/each}
            </div>
        </div>
    </MarkPopout>
{:else}
    <MarkPopout bind:show bind:markSpan bind:container>
        <div class="m-4 flex flex-col justify-center space-y-2">
            {#if failedFetch}
                Not Available
            {:else}
                <CenteredSpinner />
            {/if}
        </div>
    </MarkPopout>
{/if}
