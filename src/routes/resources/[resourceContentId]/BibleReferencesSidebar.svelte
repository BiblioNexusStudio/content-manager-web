﻿<script lang="ts">
    import { type BibleTextsReference, fetchAndFormat } from '$lib/components/references/bibleTextReferenceFetcher';
    import BibleTextReference from '$lib/components/references/BibleTextReference.svelte';
    import type { PassageReference, VerseReference } from '$lib/types/resources';
    import { instanceOfPassageReference } from '$lib/utils/reference';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { fetchLanguageDefaultBible, type BasicBible } from '$lib/utils/bibles-fetcher';
    import type { Language } from '$lib/types/base';

    export let references: (PassageReference | VerseReference)[];
    export let language: Language;
    export let visible: boolean;

    $: if (visible && !promise) {
        promise = getBibleTextsReferences();
    }

    let promise: Promise<{ bible: BasicBible | undefined; bibleTextsReferences: BibleTextsReference[] }> | null = null;

    async function getBibleTextsReferences() {
        const bible = await fetchLanguageDefaultBible(language.id);
        const bibleTextsReferences: BibleTextsReference[] = [];
        // The reason I loop instead of firing them all off at once is because it grabs by book, and
        // presumably there will be multiple within the same book. This way any follow-ups can use the cached
        // response instead of pulling the same book multiple times. It's not too often that multiple
        // books would get pulled in one go.
        for (const reference of references) {
            let bibleTextsReference: BibleTextsReference | null;
            if (instanceOfPassageReference(reference)) {
                bibleTextsReference = await fetchAndFormat(reference.startVerseId, reference.endVerseId, language);
            } else {
                bibleTextsReference = await fetchAndFormat(reference.verseId, reference.verseId, language);
            }

            if (bibleTextsReference) bibleTextsReferences.push(bibleTextsReference);
        }

        return { bible, bibleTextsReferences };
    }
</script>

{#await promise}
    <CenteredSpinner />
{:then fetched}
    {#if fetched}
        <div class="overflow-y-auto">
            <div class="m-4 flex flex-col justify-center gap-3">
                {#if fetched.bibleTextsReferences.length === 0}
                    <div>No linked Bible references.</div>
                {:else}
                    <div class="text-lg font-semibold" dir="auto">{fetched.bible?.name}</div>
                    {#each fetched.bibleTextsReferences as bibleTextsReference, i (bibleTextsReference)}
                        <div>
                            <BibleTextReference
                                bibleTextsReferences={[bibleTextsReference]}
                                collapsible={true}
                                isOpen={i === 0}
                            />
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    {/if}
{/await}
