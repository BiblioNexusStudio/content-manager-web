<script lang="ts">
    export let reportTitle: string;
    export let reportTotal: string;
    export let monthTotal: string;
    export let monthText = 'This Month';
</script>

<div class="mb-4 flex h-auto flex-col rounded border px-4 py-4 shadow-lg">
    <h3 class="mb-4 text-sm font-bold">{reportTitle}</h3>
    <div class="flex items-end justify-between">
        <span class="text-xl font-bold">{reportTotal}</span>
        <div class="flex h-auto flex-col items-end">
            <span class="text-sm font-bold text-green-600">{monthTotal}</span>
            <span class="text-sm font-bold text-green-600">{monthText}</span>
        </div>
    </div>
</div>
