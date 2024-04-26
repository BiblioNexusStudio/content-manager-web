<script lang="ts">
    export let notStartedCount: number;
    export let inProgressCount: number;
    export let inReviewCount: number;
    export let completeCount: number;
    export let showLegend: boolean;

    const total = notStartedCount + inProgressCount + inReviewCount + completeCount;
    const getWidth = (count: number) => {
        return total > 0 ? (count / total) * 100 : 0;
    };

    const notStartedWidth = getWidth(notStartedCount);
    const inProgressWidth = getWidth(inProgressCount);
    const inReviewWidth = getWidth(inReviewCount);
    const completeWidth = getWidth(completeCount);
</script>

<div class="flex w-full flex-col">
    <div class="flex h-4 w-full flex-row border border-black">
        <div class="bg-neutral" style={`width: ${completeWidth}%`}></div>
        <div class="bg-primary" style={`width: ${inReviewWidth}%`}></div>
        <div class="bg-primary bg-opacity-30" style={`width: ${inProgressWidth}%`}></div>
        <div class="bg-white" style={`width: ${notStartedWidth}%`}></div>
    </div>

    {#if showLegend}
        <div class="mt-2 flex w-fit flex-row justify-between space-x-2 text-xs">
            <div class="flex flex-row space-x-1">
                <div class="h-4 w-5 border border-black bg-white bg-opacity-30" />
                <div>Not Started</div>
            </div>
            <div class="flex flex-row space-x-1">
                <div class="h-4 w-5 border border-black bg-primary bg-opacity-30" />
                <div>In Progress</div>
            </div>
            <div class="flex flex-row space-x-1">
                <div class="h-4 w-5 border border-black bg-primary" />
                <div>In Review</div>
            </div>
            <div class="flex flex-row space-x-1">
                <div class="h-4 w-5 border border-black bg-neutral" />
                <div>Complete</div>
            </div>
        </div>
    {/if}
</div>
