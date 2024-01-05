<script lang="ts">
    import Image from './content-components/Image.svelte';
    import Video from './content-components/Video.svelte';
    import TiptapContent from './content-components/TiptapContent.svelte';
    import { MediaTypeEnum, type ResourceContentVersion } from '$lib/types/resources';

    export let mediaType: string;
    export let resourceContentVersion: ResourceContentVersion;
    export let canEdit: boolean;
    export let contentId: number;
</script>

<div class="relative flex h-full grow flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Content</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        {#if mediaType === MediaTypeEnum.image}
            <Image content={resourceContentVersion.content} />
        {:else if mediaType === MediaTypeEnum.video}
            <Video content={resourceContentVersion.content} />
        {:else if mediaType === MediaTypeEnum.text}
            <TiptapContent {canEdit} {resourceContentVersion} {contentId} />
        {/if}
    </div>
</div>
