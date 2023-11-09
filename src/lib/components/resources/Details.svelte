<script lang="ts">
    import Accordion from './Accordion.svelte';
    import { Icon } from 'svelte-awesome';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import { ResourceStatusEnum } from '$lib/types/resources';
    import { setOriginalStatus, updateStatus } from '$lib/stores/tiptapContent';

    export let translationStatus: ResourceStatusEnum;
    export let sizeText: string;
    export let hasAudio: boolean;

    setOriginalStatus(translationStatus);
    $: updateStatus(translationStatus);
</script>

<Accordion title="Details" closable={true}>
    <div class="flex w-full justify-between">
        <div class="flex w-full flex-col">
            <div class="mb-4 flex w-full items-center justify-between">
                <div class="me-2 font-bold">Translation Status</div>
                <select bind:value={translationStatus} class="select select-ghost select-sm me-2 max-w-xs">
                    <option value={ResourceStatusEnum.notStarted}>Pending</option>
                    <option value={ResourceStatusEnum.inProgress}>In Progress</option>
                    <option value={ResourceStatusEnum.completed}>Translated</option>
                </select>
            </div>
            <div class="mb-4">
                <span class="me-2 font-bold">Size</span><span>{sizeText}</span>
            </div>
        </div>
        {#if hasAudio}
            <div class="flex flex-col">
                <div class="mb-4">
                    <Icon data={volumeUp} scale={2} />
                </div>
                <div class="mb-4">Yes</div>
            </div>
        {/if}
    </div>
</Accordion>
