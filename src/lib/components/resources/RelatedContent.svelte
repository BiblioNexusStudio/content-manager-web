<script lang="ts">
    import Accordion from './Accordion.svelte';
    import { Icon } from 'svelte-awesome';
    import fileTextO from 'svelte-awesome/icons/fileTextO';
    import fileImageO from 'svelte-awesome/icons/fileImageO';
    import fileVideoO from 'svelte-awesome/icons/fileVideoO';
    import fileAudioO from 'svelte-awesome/icons/fileAudioO';
    import type { AssociatedResource } from '$lib/types/resources';
    import EmptyMessage from './EmptyMessage.svelte';

    export let relatedContent: AssociatedResource[];
    function getIcon(type: string | undefined) {
        switch (type) {
            case 'Image':
                return fileImageO;
            case 'Video':
                return fileVideoO;
            case 'Audio':
                return fileAudioO;
            default:
                return fileTextO;
        }
    }
</script>

<Accordion title="Related Content" closable={true}>
    <div class="flex flex-col">
        {#if relatedContent.length > 0}
            {#each relatedContent as resource}
                <div class="mb-6 flex">
                    <div class="flex items-center">
                        <Icon data={getIcon(resource.mediaTypes[0])} scale={3} />
                    </div>
                    <div class="ml-4 flex flex-col">
                        <span class="font-bold">{resource.label}</span>
                        <span>{resource.type}</span>
                    </div>
                </div>
            {/each}
        {:else}
            <EmptyMessage message="No related content" />
        {/if}
    </div>
</Accordion>
