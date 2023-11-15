<script lang="ts">
    import Accordion from './Accordion.svelte';
    import { Icon } from 'svelte-awesome';
    import volumeUp from 'svelte-awesome/icons/volumeUp';

    export let translationStatusText: string;
    export let sizeText: string;
    export let hasAudio: boolean;
</script>

<Accordion title="Details" closable={true}>
    <div class="flex w-full justify-between">
        <div class="flex flex-col">
            <div class="mb-4">
                <span class="me-2 font-bold">Translation Status</span><span>{translationStatusText}</span>
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
