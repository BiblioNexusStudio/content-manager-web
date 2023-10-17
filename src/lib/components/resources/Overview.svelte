<script lang="ts">
    import Accordion from './Accordion.svelte';

    export let labelText: string;
    export let typeText: string;
</script>

<Accordion title="Overview" closable={false}>
    <div class="flex flex-col">
        <div class="mb-4">
            <span class="mr-4 font-bold">Label</span><span>{labelText}</span>
        </div>
        <div class="mb-4">
            <span class="mr-4 font-bold">Type</span><span>{typeText}</span>
        </div>
    </div>
</Accordion>
