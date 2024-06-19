<script lang="ts">
    import { onMount } from 'svelte';
    import MarkPopout from '$lib/components/editorMarkPopouts/MarkPopout.svelte';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import BibleTextReference from '$lib/components/references/BibleTextReference.svelte';
    import { type BibleTextsReference, fetchAndFormat } from '$lib/components/references/bibleTextReferenceFetcher';

    export let languageId: number;

    let markSpan: HTMLElement | null;
    let show = false;
    let container: HTMLDivElement | undefined;
    let bubblingClick = false;
    let bibleTextsReference: BibleTextsReference | null;
    let failedFetch = false;

    onMount(() => {
        window.onBibleReferenceClick = async (spanId, startVerse, endVerse) => {
            // Because of the response caching used, there can still be a very slight delay when loading
            // a resource that's already cached. The timeout and duplicated show = true prevents some jank
            // when switching back and forth between references.
            bubblingClick = true;
            show = false;
            const timeout = setTimeout(() => {
                bibleTextsReference = null;
                show = true;
            }, 100);

            markSpan = document.getElementById(spanId);

            // I don't think the extra const is really needed here, but out of an abundance of caution...
            const fetchResponse = await fetchAndFormat(startVerse, endVerse, languageId);
            clearTimeout(timeout);
            show = true;
            bibleTextsReference = fetchResponse;
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

{#if bibleTextsReference}
    <MarkPopout bind:show bind:markSpan bind:container>
        <div class="overflow-y-auto" dir="auto">
            <div class="m-4 flex flex-col justify-center space-y-2">
                <BibleTextReference {bibleTextsReference} />
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
