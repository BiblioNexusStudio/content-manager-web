<script lang="ts">
    import { type BibleTextsReference, fetchAndFormat } from '$lib/components/references/bibleTextReferenceFetcher';
    import BibleTextReference from '$lib/components/references/BibleTextReference.svelte';
    import type { PassageReference, VerseReference } from '$lib/types/resources';
    import { instanceOfPassageReference } from '$lib/utils/reference';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { fetchLanguageBiblesAndEnglishDefault, type BasicBible } from '$lib/utils/bibles-fetcher';
    import type { Language } from '$lib/types/base';
    import Select from '$lib/components/Select.svelte';

    interface Props {
        references: (PassageReference | VerseReference)[];
        language: Language;
        languages: Language[];
        visible: boolean;
    }

    let { references, language, languages, visible }: Props = $props();

    let currentBibleId: number | null = $state(null);
    let bibles: BasicBible[] = $state([]);
    let fetchedBibles = $state(false);

    let currentBible = $derived(() => {
        return bibles.find((b) => b.id === currentBibleId);
    });

    let currentBibleLanguage = $derived(() => {
        return languages.find((l) => l.id === currentBible()?.languageId);
    });

    $effect(() => {
        if (visible && !promise) {
            promise = getBibleTextsReferences(language);
        }
    });

    let promise: Promise<{
        bible: BasicBible | undefined;
        bibleTextsReferences: BibleTextsReference[];
    }> | null = $state(null);

    async function getBibleTextsReferences(language: Language) {
        if (!fetchedBibles) {
            bibles = await fetchLanguageBiblesAndEnglishDefault(language.id);
            fetchedBibles = true;
        }

        const bible = bibles.some((b) => b.languageId === language.id && b.isLanguageDefault)
            ? bibles.find((b) => b.languageId === language.id && b.isLanguageDefault)
            : bibles.find((b) => b.languageId === 1 && b.isLanguageDefault);

        if (currentBibleId === null) {
            currentBibleId = bible?.id ?? null;
        }
        const bibleTextsReferences: BibleTextsReference[] = [];
        // The reason I loop instead of firing them all off at once is because it grabs by book, and
        // presumably there will be multiple within the same book. This way any follow-ups can use the cached
        // response instead of pulling the same book multiple times. It's not too often that multiple
        // books would get pulled in one go.
        for (const reference of references) {
            let bibleTextsReference: BibleTextsReference | null;
            if (instanceOfPassageReference(reference)) {
                bibleTextsReference = await fetchAndFormat(
                    reference.startVerseId,
                    reference.endVerseId,
                    language,
                    currentBible()?.id
                );
            } else {
                bibleTextsReference = await fetchAndFormat(
                    reference.verseId,
                    reference.verseId,
                    language,
                    currentBible()?.id
                );
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
                {#if fetched.bibleTextsReferences.length === 0 && bibles.length < 2}
                    <div>No linked Bible references.</div>
                {:else}
                    <Select
                        class="select select-bordered select-sm mb-2"
                        options={bibles.map((b) => ({ value: b.id, label: b.name }))}
                        bind:value={currentBibleId}
                        isNumber={true}
                        appInsightsEventName="bible-reference-sidebar-select-bible"
                        onChange={() => {
                            promise = getBibleTextsReferences(currentBibleLanguage() ?? language);
                        }}
                    />
                    {#if fetched.bibleTextsReferences.length === 0}
                        <div>No linked Bible references for selected Bible.</div>
                    {:else}
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
                {/if}
            </div>
        </div>
    {/if}
{/await}
