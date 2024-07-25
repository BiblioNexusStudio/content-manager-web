<script lang="ts">
    import { project } from '$lib/stores/projects';

    const columns = [
        { name: 'title', label: 'Title' },
        { name: 'type', label: 'Resource' },
        { name: 'assigned', label: 'Assigned' },
        { name: 'status', label: 'Status' },
        { name: 'wordCount', label: 'Source Words' },
    ];
</script>

{#if $project?.items}
    <div class="grid h-auto w-full grid-cols-5">
        {#each columns as column (column.label)}
            <div class="border-b bg-gray-50 px-4 py-3 text-xs font-bold">{column.label}</div>
        {/each}
    </div>

    <div class="grid w-full grow grid-cols-5 overflow-auto">
        {#each $project?.items as item (item.resourceContentId)}
            <a
                href={`/resources/${item.resourceContentId}`}
                class="flex items-center border-b px-4 py-3 text-sm text-gray-600">{item?.englishLabel ?? ''}</a
            >
            <a
                href={`/resources/${item.resourceContentId}`}
                class="flex items-center border-b px-4 py-3 text-sm text-gray-600">{item?.parentResourceName ?? ''}</a
            >
            <a
                href={`/resources/${item.resourceContentId}`}
                class="flex items-center border-b px-4 py-3 text-sm text-gray-600"
                >{item?.assignedUserName ??
                    (item?.statusDisplayName?.includes('In Progress') ? 'External User' : '')}</a
            >
            <a
                href={`/resources/${item.resourceContentId}`}
                class="flex items-center border-b px-4 py-3 text-sm text-gray-600">{item?.statusDisplayName ?? ''}</a
            >
            <a
                href={`/resources/${item.resourceContentId}`}
                class="flex items-center border-b px-4 py-3 text-sm text-gray-600">{item?.wordCount ?? ''}</a
            >
        {/each}
    </div>
{/if}
