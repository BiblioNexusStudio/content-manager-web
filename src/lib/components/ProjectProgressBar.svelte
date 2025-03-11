<script lang="ts">
    interface Props {
        class?: string;
        notStartedCount: number;
        editorReviewCount: number;
        inCompanyReviewCount: number;
        inPublisherReviewCount: number;
        completeCount: number;
        showLegend?: boolean;
    }

    let {
        notStartedCount,
        editorReviewCount,
        inCompanyReviewCount,
        inPublisherReviewCount,
        completeCount,
        showLegend,
        class: ClassName,
    }: Props = $props();

    const total = notStartedCount + editorReviewCount + inCompanyReviewCount + inPublisherReviewCount + completeCount;
    const getWidth = (count: number) => {
        return total > 0 ? (count / total) * 100 : 0;
    };

    const notStartedWidth = getWidth(notStartedCount);
    const editorReviewWidth = getWidth(editorReviewCount);
    const inCompanyReviewWidth = getWidth(inCompanyReviewCount);
    const inPublisherReviewWidth = getWidth(inPublisherReviewCount);
    const completeWidth = getWidth(completeCount);

    function getTooltipText(width: number) {
        if (width > 0 && width < 1) {
            return '< 1%';
        }
        return width > 0 ? `${Math.round(width)}%` : '';
    }
</script>

<div class="flex w-full flex-col {ClassName}">
    <div class="flex h-4 w-full flex-row border border-black">
        <div
            class="tooltip tooltip-info bg-neutral"
            data-tip={getTooltipText(completeWidth)}
            style={`width: ${completeWidth}%`}
        ></div>
        <div
            class="tooltip tooltip-info bg-primary"
            data-tip={getTooltipText(inPublisherReviewWidth)}
            style={`width: ${inPublisherReviewWidth}%`}
        ></div>
        <div
            class="tooltip tooltip-info bg-primary bg-opacity-60"
            data-tip={getTooltipText(inCompanyReviewWidth)}
            style={`width: ${inCompanyReviewWidth}%`}
        ></div>
        <div
            class="tooltip tooltip-info bg-primary bg-opacity-25"
            data-tip={getTooltipText(editorReviewWidth)}
            style={`width: ${editorReviewWidth}%`}
        ></div>
        <div
            class="tooltip tooltip-info bg-white"
            data-tip={getTooltipText(notStartedWidth)}
            style={`width: ${notStartedWidth}%`}
        ></div>
    </div>

    {#if showLegend}
        <div class="mt-2 flex w-fit flex-row justify-between space-x-2 text-xs">
            <div class="flex flex-row space-x-1">
                <div class="bg-opacity-30 h-4 w-5 border border-black bg-white"></div>
                <div>AI Draft</div>
            </div>
            <div class="flex flex-row space-x-1">
                <div class="bg-primary bg-opacity-25 h-4 w-5 border border-black"></div>
                <div>Editor Review</div>
            </div>
            <div class="flex flex-row space-x-1">
                <div class="bg-primary bg-opacity-60 h-4 w-5 border border-black"></div>
                <div>Company Review</div>
            </div>
            <div class="flex flex-row space-x-1">
                <div class="bg-primary h-4 w-5 border border-black"></div>
                <div>Publisher Review</div>
            </div>
            <div class="flex flex-row space-x-1">
                <div class="bg-neutral h-4 w-5 border border-black"></div>
                <div>Complete</div>
            </div>
        </div>
    {/if}
</div>
