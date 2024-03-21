<script lang="ts">
    export let inProgressCount: number;
    export let inReviewCount: number;
    export let completeCount: number;
    export let showLegend: boolean;

    const total = inProgressCount + inReviewCount + completeCount;
    const inProgressWidth = total > 0 ? (inProgressCount / total) * 100 : 0;
    const inReviewWidth = total > 0 ? (inReviewCount / total) * 100 : 0;
    const completeWidth = total > 0 ? (completeCount / total) * 100 : 0;
</script>

<div class="flex w-full flex-col">
    <div class="flex h-4 w-full flex-row">
        <div class="h-4 bg-primary bg-opacity-30" style={`width: ${inProgressWidth}%`}></div>
        <div class="h-4 bg-primary" style={`width: ${inReviewWidth}%`}></div>
        <div class="h-4 bg-neutral" style={`width: ${completeWidth}%`}></div>
    </div>

    {#if showLegend}
        <div class="mt-2 flex w-fit flex-row justify-between space-x-2 text-xs">
            <div class="flex flex-row space-x-1">
                <div class="h-4 w-5 bg-primary bg-opacity-30" />
                <div>In Progress</div>
            </div>
            <div class="flex flex-row space-x-1">
                <div class="h-4 w-5 bg-primary" />
                <div>In Review</div>
            </div>
            <div class="flex flex-row space-x-1">
                <div class="h-4 w-5 bg-neutral" />
                <div>Complete</div>
            </div>
        </div>
    {/if}
</div>
