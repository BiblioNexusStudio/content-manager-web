<script lang="ts">
    export let reportTitle: string;
    export let reportDescription: string;
    export let reportLink: string;
</script>

<div class="flex flex-col rounded border px-4 py-2 shadow-lg">
    <h3 class="mb-2 text-xl font-bold">{reportTitle}</h3>
    <div class="mb-2 text-xs text-gray-500">{reportDescription}</div>
    <a href={reportLink} class="text-sm text-blue-500" target="_blank" rel="noopener noreferrer">View Report</a>
</div>
