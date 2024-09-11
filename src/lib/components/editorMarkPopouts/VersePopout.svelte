<script lang="ts">
    import { onMount } from 'svelte';
    import MarkPopout from '$lib/components/editorMarkPopouts/MarkPopout.svelte';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import BibleTextReference from '$lib/components/references/BibleTextReference.svelte';
    import { type BibleTextsReference, fetchAndFormat } from '$lib/components/references/bibleTextReferenceFetcher';
    import type { Language } from '$lib/types/base';

    export let language: Language;

    let markSpan: HTMLElement | null;
    let show = false;
    let container: HTMLDivElement | undefined;
    let bubblingClick = false;
    let bibleTextsReferences: BibleTextsReference[] | null;
    let failedFetch = false;

    onMount(() => {
        window.onBibleReferenceClick = async (spanId, verses) => {
            // Because of the response caching used, there can still be a very slight delay when loading
            // a resource that's already cached. The timeout and duplicated show = true prevents some jank
            // when switching back and forth between references.
            bubblingClick = true;
            show = false;
            failedFetch = false;
            const timeout = setTimeout(() => {
                bibleTextsReferences = null;
                show = true;
            }, 100);

            markSpan = document.getElementById(spanId);

            const responses: BibleTextsReference[] = [];
            for (const [startVerse, endVerse] of verses) {
                const fetchResponse = await fetchAndFormat(startVerse, endVerse, language);
                if (fetchResponse) {
                    responses.push(fetchResponse);
                }
            }
            if (responses.length) {
                failedFetch = true;
            }
            clearTimeout(timeout);
            show = true;
            bibleTextsReferences = responses;
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

{#if bibleTextsReferences?.length}
    <MarkPopout bind:show bind:markSpan bind:container>
        <div class="overflow-y-auto" dir="auto">
            <div class="m-4 flex flex-col justify-center space-y-2">
                <BibleTextReference {bibleTextsReferences} />
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
