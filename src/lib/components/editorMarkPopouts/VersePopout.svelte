<script lang="ts">
    import { onMount } from 'svelte';
    import MarkPopout from '$lib/components/editorMarkPopouts/MarkPopout.svelte';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { fetchBiblePassages, type BookPassage } from '$lib/utils/bible-passage-fetcher';
    import { generateVerseFromReference } from '$lib/utils/reference';

    let markSpan: HTMLElement | null;
    let show = false;
    let container: HTMLDivElement | undefined;
    let bubblingClick = false;
    let passages: BookPassage[] | undefined;
    let verseDisplayName = '';
    let singleChapter = true;
    let singleBook = true;
    let failedFetch = false;

    const fetch = async (startVerse: string, endVerse: string) => {
        const bookPassages = await fetchBiblePassages(startVerse, endVerse);

        if (!bookPassages || bookPassages.length === 0) {
            failedFetch = true;
            return;
        }

        if (
            bookPassages.length === 1 &&
            bookPassages[0]?.chapters.length === 1 &&
            bookPassages[0]?.chapters[0]?.verses.length === 1
        ) {
            verseDisplayName = generateVerseFromReference({
                verseId: 0,
                book: bookPassages[0].book.name,
                chapter: bookPassages[0].chapters[0].number,
                verse: bookPassages[0].chapters[0].verses[0]!.number,
            });
        } else {
            const passageStart = bookPassages[0]!;
            const passageEnd = bookPassages.at(-1)!;

            verseDisplayName = generateVerseFromReference({
                startVerseId: 0,
                startBook: passageStart.book.name,
                startChapter: passageStart.chapters[0]!.number,
                startVerse: passageStart.chapters[0]!.verses[0]!.number,
                endVerseId: 0,
                endBook: passageEnd.book.name,
                endChapter: passageEnd.chapters.at(-1)!.number,
                endVerse: passageEnd.chapters.at(-1)!.verses.at(-1)!.number,
            });
        }

        singleBook = bookPassages.length === 1;
        singleChapter = singleBook && bookPassages[0]!.chapters.length === 1;

        return bookPassages;
    };

    onMount(() => {
        window.onBibleReferenceClick = async (spanId, startVerse, endVerse) => {
            bubblingClick = true;
            passages = undefined;
            show = true;
            markSpan = document.getElementById(spanId);

            passages = await fetch(startVerse, endVerse);
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

{#if passages}
    <MarkPopout bind:show bind:markSpan bind:container>
        <div class="overflow-y-auto">
            <div class="m-4 flex flex-col justify-center space-y-2">
                <div class="mb-2 font-semibold">{verseDisplayName}</div>
                {#each passages as passage (passage)}
                    {#if !singleBook}
                        <div class="font-semibold">{passage.book.name}</div>
                    {/if}
                    {#each passage.chapters as chapter (chapter)}
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
