<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import fileImageO from 'svelte-awesome/icons/fileImageO';
    import fileVideoO from 'svelte-awesome/icons/fileVideoO';
    import fileAudioO from 'svelte-awesome/icons/fileAudioO';
    import { type AssociatedResource, MediaTypeEnum } from '$lib/types/resources';
    import EmptyMessage from './EmptyMessage.svelte';

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

<div class="mb-4 flex h-fit max-h-72 flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Related Content</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        <div class="flex flex-col">
            {#if relatedContent.length > 0}
                {#each relatedContent as resource}
                    <div class="mb-4 flex">
                        <div class="flex items-center">
                            <Icon data={getIcon(resource.mediaTypes[0])} scale={3} />
                        </div>
                        <div class="ms-4 flex flex-col">
                            <span class="font-bold">{resource.label}</span>
                            <span>{resource.parentResourceName}</span>
                        </div>
                    </div>
                {/each}
            {:else}
                <EmptyMessage message="No related content" />
            {/if}
        </div>
    </div>
</div>
