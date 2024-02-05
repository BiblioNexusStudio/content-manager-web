<script lang="ts">
    const columns = [
        { name: 'title', label: 'Title' },
        { name: 'company', label: 'Company' },
        { name: 'platform', label: 'Platform' },
        { name: 'language', label: 'Language' },
        { name: 'projectLead', label: 'Project Lead' },
        { name: 'days', label: 'Days' },
        { name: 'progress', label: 'Progress' },
    ];

    console.log(columns.length);
</script>

<div class="grid w-full grid-cols-7 rounded-md border border-b-0">
    {#each columns as column}
        <div class="border-b bg-gray-50 px-4 py-3 text-xs font-bold">{column.label}</div>
    {/each}
    <div class="border-b px-4 py-3 text-sm text-gray-600">test</div>
    <div class="border-b px-4 py-3 text-sm text-gray-600">test</div>
    <div class="border-b px-4 py-3 text-sm text-gray-600">test</div>
    <div class="border-b px-4 py-3 text-sm text-gray-600">test</div>
    <div class="border-b px-4 py-3 text-sm text-gray-600">test</div>
    <div class="border-b px-4 py-3 text-sm text-gray-600">test</div>
    <div class="border-b px-4 py-3 text-sm text-gray-600">test</div>
</div>
