<script lang="ts">
    interface Props {
        addPlus?: boolean;
        reportTitle: string;
        reportTotal: number;
        monthTotal: number;
        monthText?: string;
    }

    let { addPlus = false, reportTitle, reportTotal, monthTotal, monthText = 'This Month' }: Props = $props();
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
