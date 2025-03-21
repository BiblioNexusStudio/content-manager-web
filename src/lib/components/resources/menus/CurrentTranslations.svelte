<script lang="ts">
    import type { Language } from '$lib/types/base';
    import type { ContentTranslation, Project } from '$lib/types/resources';
    import { sortByKey } from '$lib/utils/sorting';
    import { Icon } from 'svelte-awesome';
    import plus from 'svelte-awesome/icons/plus';
    import StatusColor from '../StatusColor.svelte';
    import type { ResourceContentStatusEnum } from '$lib/types/base';

    interface Props {
        languages: Language[];
        translations: ContentTranslation[];
        englishTranslation: ContentTranslation | undefined;
        canCreateTranslation: boolean;
        openModal: () => void;
        currentResourceId: number;
        project: Project | null;
    }

    let {
        languages,
        translations,
        englishTranslation,
        canCreateTranslation,
        openModal,
        currentResourceId,
        project,
    }: Props = $props();

    let numberOfTranslations = $derived(translations.length);

    const mappedTranslations = sortByKey(
        translations.map((translation) => ({
            languageName: languages.find((x) => x.id === translation.languageId)?.englishDisplay ?? '',
            status: translation.status,
            contentId: translation.contentId,
            resourceContentStatus: translation.resourceContentStatus as ResourceContentStatusEnum,
        })),
        'languageName'
    )!;

    const currentResource = mappedTranslations.find((x) => x.contentId === currentResourceId);

    const filteredMappedTranslations = mappedTranslations.filter((x) => x.contentId !== currentResourceId);
</script>

<div class="dropdown ms-2">
    <button tabindex="0" class="btn btn-ghost hover:bg-primary hover:text-primary-content flex flex-nowrap px-1">
        <span data-app-insights-event-name="translations-menu-click">Translations</span>
        <div class="border-primary-content bg-primary flex h-6 w-6 items-center justify-center rounded-full border">
            <span class="text-primary-content">{numberOfTranslations}</span>
        </div>
    </button>
    <div
        role="button"
        tabindex="0"
        class="menu dropdown-content rounded-box bg-base-100 z-1 mt-4 flex w-auto flex-col border px-4 pt-4 shadow-sm"
    >
        {#if canCreateTranslation && englishTranslation?.hasPublished && languages.length !== translations.length}
            <div class="mt-2 mb-4 flex flex-col place-items-end border-y px-4 py-3">
                <button
                    data-app-insights-event-name="translations-new-menu-click"
                    class="bg-primary text-primary-content flex w-full items-center justify-start rounded-md border border-[#bbe7f7] px-2 py-1 text-lg font-bold"
                    onclick={() => openModal()}
                >
                    <span class="text-primary-content me-2"><Icon data={plus} /></span>Translation
                </button>
            </div>
        {/if}
        <div class="flex flex-col">
            {#if currentResource}
                <div class="mb-2 flex items-center justify-between px-4">
                    <span class="btn-link me-4 text-lg font-bold whitespace-nowrap no-underline"
                        ><a href={`/resources/${currentResource.contentId}`}>{currentResource.languageName}</a></span
                    >
                    <div class="ms-8 flex items-center">
                        <StatusColor status={currentResource.resourceContentStatus} /><span
                            class="text-lg whitespace-nowrap">{currentResource.status}</span
                        >
                    </div>
                </div>
            {/if}
            {#if project && !project.isComplete}
                <div
                    class="mb-4 flex items-center justify-between px-4"
                    data-app-insights-event-name="translations-project-menu-click"
                >
                    <span class="text-lg font-bold">Project:</span>
                    <span class="btn-link ms-8 flex w-72 justify-end text-lg font-bold no-underline"
                        ><a href={`/projects/${project.id}`} class="truncate">{project.name}</a></span
                    >
                </div>
            {/if}
            {#if currentResource || project}
                <div class="mb-4 w-full border-b"></div>
            {/if}
            {#each filteredMappedTranslations as translation (translation.contentId)}
                <div
                    class="mb-2 flex items-center justify-between px-4"
                    data-app-insights-event-name="translations-language-menu-click"
                >
                    <span class="btn-link me-4 text-lg font-bold whitespace-nowrap no-underline"
                        ><a href={`/resources/${translation.contentId}`}>{translation.languageName}</a></span
                    >
                    <div class="ms-8 flex items-center">
                        <StatusColor status={translation.resourceContentStatus} /><span
                            class="text-lg whitespace-nowrap">{translation.status}</span
                        >
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
