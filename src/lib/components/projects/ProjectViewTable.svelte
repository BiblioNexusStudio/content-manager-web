<script lang="ts">
    import { project } from '$lib/stores/projects';

    const columns = [
        { name: 'title', label: 'Title' },
        { name: 'type', label: 'Type' },
        { name: 'assigned', label: 'Assigned' },
        { name: 'status', label: 'Status' },
    ];
</script>

{#if $project?.items}
    <div class="grid h-auto w-full grid-cols-4">
        {#each columns as column}
            <div class="border-b bg-gray-50 px-4 py-3 text-xs font-bold">{column.label}</div>
        {/each}
    </div>

    <div class="grid w-full grow grid-cols-4 overflow-auto">
        {#each $project?.items as item}
            <div class="border-b px-4 py-3 text-sm text-gray-600">{item?.englishLabel ?? ''}</div>
            <div class="border-b px-4 py-3 text-sm text-gray-600">{item?.parentResourceName ?? ''}</div>
            <div class="border-b px-4 py-3 text-sm text-gray-600">{item?.assignedUserName ?? ''}</div>
            <div class="border-b px-4 py-3 text-sm text-gray-600">{item?.statusDisplayName ?? ''}</div>
        {/each}
    </div>
{/if}
