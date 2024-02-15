<script lang="ts">
    import { formatDate } from '$lib/utils/projects';
    import DatePicker from '../DatePicker.svelte';
    import { project } from '$lib/stores/projects';
</script>

<div class="my-4 grid min-h-[120px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Projected Company Delivery Date</div>
            {#if $project?.started === null}
                <DatePicker date={$project?.projectedDeliveryDate ?? ''} />
            {:else}
                <div>{formatDate($project?.projectedDeliveryDate)}</div>
            {/if}
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Actual Company Devlivery Date</div>
            {#if $project?.started === null}
                <DatePicker date={$project?.actualDeliveryDate ?? ''} />
            {:else}
                <div>{formatDate($project?.actualDeliveryDate)}</div>
            {/if}
        </div>
    </div>
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Projected Publish Date</div>
            {#if $project?.started === null}
                <DatePicker date={$project?.projectedPublishDate ?? ''} />
            {:else}
                <div>{formatDate($project?.projectedPublishDate)}</div>
            {/if}
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Actual Publish Devlivery Date</div>
            <div>{formatDate($project?.projectedDeliveryDate)}</div>
        </div>
    </div>
</div>
