<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import fileImageO from 'svelte-awesome/icons/fileImageO';
    import fileVideoO from 'svelte-awesome/icons/fileVideoO';
    import fileAudioO from 'svelte-awesome/icons/fileAudioO';
    import { type AssociatedResource, MediaTypeEnum } from '$lib/types/resources';
    import EmptyMessage from '../EmptyMessage.svelte';

    interface Props {
        relatedContent: AssociatedResource[];
    }

    let { relatedContent }: Props = $props();
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
        tabindex="0"
        class="btn btn-ghost hover:bg-primary hover:text-primary-content ms-2 px-1 whitespace-nowrap"
        data-app-insights-event-name="related-content-menu-click"
    >
        Related Content
    </button>
    <div
        role="button"
        tabindex="0"
        class="menu dropdown-content rounded-box bg-base-100 z-1 mt-4 max-h-72 w-auto border pt-4 shadow-sm"
    >
        <div class="flex flex-col overflow-y-auto px-8">
            {#each relatedContent as resource, i (i)}
                <div class="me-2 mb-4 flex">
                    <div class="flex items-center">
                        <Icon data={getIcon(resource.mediaTypes[0])} scale={2} />
                    </div>
                    <div class="ms-4 flex flex-col">
                        {#if resource.contentId}
                            <a
                                href={`/resources/${resource.contentId}`}
                                class="text-primary text-lg font-bold whitespace-nowrap">{resource.englishLabel}</a
                            >
                        {:else}
                            <span class="text-lg font-bold whitespace-nowrap">{resource.englishLabel}</span>
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
