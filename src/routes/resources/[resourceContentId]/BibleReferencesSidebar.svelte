<script lang="ts">
    import { type BibleTextsReference, fetchAndFormat } from '$lib/components/references/bibleTextReferenceFetcher';
    import BibleTextReference from '$lib/components/references/BibleTextReference.svelte';
    import type { PassageReference, VerseReference } from '$lib/types/resources';
    import { instanceOfPassageReference } from '$lib/utils/reference';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { fetchLanguageDefaultBible } from '$lib/utils/bibles-fetcher';

    export let references: (PassageReference | VerseReference)[];
    export let languageId: number;

    const promise = getBibleTextsReferences();
    async function getBibleTextsReferences() {
        const bible = await fetchLanguageDefaultBible(languageId);
        const bibleTextsReferences: BibleTextsReference[] = [];
        // The reason I loop instead of firing them all off at once is because it grabs by book, and
        // presumably there will be multiple within the same book. This way any follow-ups can use the cached
        // response instead of pulling the same book multiple times. It's not too often that multiple
        // books would get pulled in one go.
        for (let i = 0; i < references.length; i++) {
            let bibleTextsReference: BibleTextsReference | null;
            const reference = references[i]!;
            if (instanceOfPassageReference(reference)) {
                bibleTextsReference = await fetchAndFormat(
                    reference.startVerseId.toString(),
                    reference.endVerseId.toString(),
                    languageId
                );
            } else {
                bibleTextsReference = await fetchAndFormat(
                    reference.verseId.toString(),
                    reference.verseId.toString(),
                    languageId
                );
            }

            if (bibleTextsReference) bibleTextsReferences.push(bibleTextsReference);
        }

        return { bible, bibleTextsReferences };
    }
</script>

{#await promise}
    <CenteredSpinner />
{:then { bible, bibleTextsReferences }}
    <div class="overflow-y-auto">
        <div class="m-4 flex flex-col justify-center gap-3">
            {#if bibleTextsReferences.length === 0}
                <div>No linked Bible references.</div>
            {:else}
                <div class="text-lg font-semibold" dir="auto">{bible?.name}</div>
                {#each bibleTextsReferences as bibleTextsReference, i (bibleTextsReference)}
                    <div>
                        <BibleTextReference {bibleTextsReference} collapsible={true} isOpen={i === 0} />
                    </div>
                {/each}
            {/if}
        </div>
    </div>
{/await}
