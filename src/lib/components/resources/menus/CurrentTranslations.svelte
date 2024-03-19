<script lang="ts">
    import type { Language } from '$lib/types/base';
    import type { ContentTranslation } from '$lib/types/resources';
    import { sortByKey } from '$lib/utils/sorting';
    import { Icon } from 'svelte-awesome';
    import plus from 'svelte-awesome/icons/plus';
    import StatusColor from '../StatusColor.svelte';
    import type { ResourceContentStatusEnum } from '$lib/types/base';

    export let languages: Language[];
    export let translations: ContentTranslation[];
    export let englishTranslation: ContentTranslation | undefined;
    export let canCreateTranslation: boolean;
    export let openModal: () => void;

    $: numberOfTranslations = translations.length;

    const mappedTranslations = sortByKey(
        translations.map((translation) => ({
            languageName: languages.find((x) => x.id === translation.languageId)?.englishDisplay ?? '',
            status: translation.status as ResourceContentStatusEnum,
            contentId: translation.contentId,
        })),
        'languageName'
    )!;
</script>

<div class="dropdown ms-2">
    <button class="btn btn-ghost flex flex-nowrap px-1 hover:bg-[#e6f6fc]">
        <span>Translations</span>
        <span class="flex h-6 w-6 items-center justify-center rounded-full border border-blue-300 bg-blue-50"
            >{numberOfTranslations}</span
        >
    </button>
    <div class="menu dropdown-content z-[1] mt-4 max-h-72 w-auto rounded-box bg-base-100 px-4 pt-4 shadow">
        {#if canCreateTranslation && englishTranslation?.hasPublished && languages.length !== translations.length}
            <div class="mb-4 mt-2 flex flex-col place-items-end border-y px-4 py-2">
                <button class="btn-small btn btn-primary w-full" on:click={() => openModal()}>
                    <Icon data={plus} />Translation
                </button>
            </div>
        {/if}
        <div class="flex flex-col">
            {#each mappedTranslations as translation (translation.contentId)}
                <div class="mb-2 flex justify-between px-4">
                    <span class="btn-link me-4 font-bold no-underline"
                        ><a href={`/resources/${translation.contentId}`}>{translation.languageName}</a></span
                    ><StatusColor status={translation.status} /><span class="whitespace-nowrap"
                        >{translation.status}</span
                    >
                </div>
            {/each}
        </div>
    </div>
</div>
