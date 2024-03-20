<script lang="ts">
    import type { Language } from '$lib/types/base';
    import type { ContentTranslation, Project } from '$lib/types/resources';
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
    export let currentResourceId: string;
    export let project: Project | null;

    $: numberOfTranslations = translations.length;

    const mappedTranslations = sortByKey(
        translations.map((translation) => ({
            languageName: languages.find((x) => x.id === translation.languageId)?.englishDisplay ?? '',
            status: translation.status,
            contentId: translation.contentId,
            resourceContentStatus: translation.resourceContentStatus as ResourceContentStatusEnum,
        })),
        'languageName'
    )!;

    const currentResource = mappedTranslations.find((x) => x.contentId === parseInt(currentResourceId));

    const filteredMappedTranslations = mappedTranslations.filter((x) => x.contentId !== parseInt(currentResourceId));
</script>

<div class="dropdown ms-2">
    <button class="btn btn-ghost flex flex-nowrap px-1 hover:bg-[#e6f6fc]">
        <span>Translations</span>
        <span class="flex h-6 w-6 items-center justify-center rounded-full border border-blue-300 bg-blue-50"
            >{numberOfTranslations}</span
        >
    </button>
    <div class="menu dropdown-content z-[1] mt-4 flex w-auto flex-col rounded-box border bg-base-100 px-4 pt-4 shadow">
        {#if canCreateTranslation && englishTranslation?.hasPublished && languages.length !== translations.length}
            <div class="mb-4 mt-2 flex flex-col place-items-end border-y px-4 py-3">
                <button
                    class="flex w-full items-center justify-start rounded-md border border-[#bbe7f7] bg-[#e6f6fc] px-2 py-1 text-lg font-bold"
                    on:click={() => openModal()}
                >
                    <span class="me-2 text-[#15abe3]"><Icon data={plus} /></span>Translation
                </button>
            </div>
        {/if}
        <div class="flex flex-col">
            {#if currentResource}
                <div class="mb-2 flex items-center justify-between px-4">
                    <span class="btn-link me-4 whitespace-nowrap text-lg font-bold no-underline"
                        ><a href={`/resources/${currentResource.contentId}`}>{currentResource.languageName}</a></span
                    >
                    <div class="ms-8 flex items-center">
                        <StatusColor status={currentResource.resourceContentStatus} /><span
                            class="whitespace-nowrap text-lg">{currentResource.status}</span
                        >
                    </div>
                </div>
            {/if}
            {#if project}
                <div class="mb-4 flex items-center justify-between px-4">
                    <span class="text-lg font-bold">Project:</span><span
                        class="btn-link ms-8 w-72 truncate text-lg font-bold no-underline"
                        ><a href={`/projects/${project.id}`}>{project.name}</a></span
                    >
                </div>
            {/if}
            {#if currentResource || project}
                <div class="mb-4 w-full border-b"></div>
            {/if}
            {#each filteredMappedTranslations as translation (translation.contentId)}
                <div class="mb-2 flex items-center justify-between px-4">
                    <span class="btn-link me-4 whitespace-nowrap text-lg font-bold no-underline"
                        ><a href={`/resources/${translation.contentId}`}>{translation.languageName}</a></span
                    >
                    <div class="ms-8 flex items-center">
                        <StatusColor status={translation.resourceContentStatus} /><span
                            class="whitespace-nowrap text-lg">{translation.status}</span
                        >
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
