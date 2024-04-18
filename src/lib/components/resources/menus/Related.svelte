<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import fileImageO from 'svelte-awesome/icons/fileImageO';
    import fileVideoO from 'svelte-awesome/icons/fileVideoO';
    import fileAudioO from 'svelte-awesome/icons/fileAudioO';
    import { type AssociatedResource, MediaTypeEnum } from '$lib/types/resources';
    import EmptyMessage from '../EmptyMessage.svelte';

    export let relatedContent: AssociatedResource[];
    function getIcon(type: string | undefined) {
        switch (type) {
            case MediaTypeEnum.image:
                return fileImageO;
            case MediaTypeEnum.video:
                return fileVideoO;
            case MediaTypeEnum.audio:
                return fileAudioO;
            default:
                return fileTextO;
        }
    }
</script>

<div class="dropdown ms-1">
    <button
        class="btn btn-ghost ms-2 whitespace-nowrap px-1 hover:bg-[#e6f6fc]"
        data-app-insights-event-name="related-content-menu-click"
    >
        Related Content
    </button>
    <div class="menu dropdown-content z-[1] mt-4 max-h-72 w-auto rounded-box border bg-base-100 pt-4 shadow">
        <div class="flex flex-col overflow-y-auto px-8">
            {#each relatedContent as resource, i (i)}
                <div class="mb-4 me-2 flex">
                    <div class="flex items-center">
                        <Icon data={getIcon(resource.mediaTypes[0])} scale={2} />
                    </div>
                    <div class="ms-4 flex flex-col">
                        {#if resource.contentId}
                            <a
                                href={`/resources/${resource.contentId}`}
                                class="whitespace-nowrap text-lg font-bold text-primary">{resource.englishLabel}</a
                            >
                        {:else}
                            <span class="whitespace-nowrap text-lg font-bold">{resource.englishLabel}</span>
                        {/if}
                        <span class="whitespace-nowrap">{resource.parentResourceName}</span>
                    </div>
                </div>
            {:else}
                <EmptyMessage message="No related content" />
            {/each}
        </div>
    </div>
</div>
