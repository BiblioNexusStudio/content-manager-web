<script lang="ts">
    import type { Language } from '$lib/types/base';
    import type { ContentTranslation } from '$lib/types/resources';
    import { sortByKey } from '$lib/utils/sorting';

    export let languages: Language[];
    export let translations: ContentTranslation[];
    export let englishTranslation: ContentTranslation | undefined;
    export let canCreateTranslation: boolean;
    export let openModal: () => void;

    const mappedTranslations = sortByKey(
        translations.map((translation) => ({
            languageName: languages.find((x) => x.id === translation.languageId)?.englishDisplay ?? '',
            status: translation.status,
            contentId: translation.contentId,
        })),
        'languageName'
    )!;
</script>

<div class="mb-4 flex h-fit flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Translations</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        <div class="flex flex-col">
            {#each mappedTranslations as translation (translation.contentId)}
                <div class="mb-2 flex justify-between">
                    <span class="btn-link me-4 font-bold no-underline"
                        ><a href={`/resources/${translation.contentId}`}>{translation.languageName}</a></span
                    ><span>{translation.status}</span>
                </div>
            {/each}
        </div>
        {#if canCreateTranslation && englishTranslation?.hasPublished && languages.length !== translations.length}
            <div class="mt-2 flex flex-col place-items-end">
                <button class="btn btn-primary btn-sm" on:click={() => openModal()}> Add </button>
            </div>
        {/if}
    </div>
</div>
