<script lang="ts">
    export let addPlus = false;
    export let reportTitle: string;
    export let reportTotal: number;
    export let monthTotal: number;
    export let monthText = 'This Month';
</script>

<div class="mb-4 flex h-auto flex-col rounded border px-4 py-4 shadow-lg">
    <h3 class="mb-4 text-sm font-bold">{reportTitle}</h3>
    <div class="flex items-end justify-between">
        <span class="text-xl font-bold">{reportTotal.toLocaleString()}</span>
        <div class="flex h-auto flex-col items-end">
            <span class="text-sm font-bold {monthTotal > 0 ? 'text-green-600' : ''}"
                >{addPlus ? '+' : ''}{monthTotal.toLocaleString()}</span
            >
            <span class="text-sm font-bold {monthTotal > 0 ? 'text-green-600' : ''}">{monthText}</span>
        </div>
    </div>
</div>
