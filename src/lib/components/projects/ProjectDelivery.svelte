<script lang="ts">
    import { formatDate } from '$lib/utils/projects';
    import DatePicker from '../DatePicker.svelte';
    import { project } from '$lib/stores/projects';
    import ViewTabSlot from './ViewTabSlot.svelte';
</script>

<div class="my-4 grid min-h-[192px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <ViewTabSlot title="Projected Company Delivery Date">
            {#if $project?.started === null}
                <DatePicker date={$project?.projectedDeliveryDate ?? ''} />
            {:else}
                <div>{formatDate($project?.projectedDeliveryDate)}</div>
            {/if}
        </ViewTabSlot>
        <ViewTabSlot title="Actual Company Devlivery Date">
            {#if $project?.started === null}
                <DatePicker date={$project?.actualDeliveryDate ?? ''} />
            {:else}
                <div>{formatDate($project?.actualDeliveryDate)}</div>
            {/if}
        </ViewTabSlot>
    </div>
    <div class="flex flex-col">
        <ViewTabSlot title="Projected Publish Date">
            {#if $project?.started === null}
                <DatePicker date={$project?.projectedPublishDate ?? ''} />
            {:else}
                <div>{formatDate($project?.projectedPublishDate)}</div>
            {/if}
        </ViewTabSlot>
        <ViewTabSlot title="Actual Publish Date">
            <div>{formatDate($project?.projectedDeliveryDate)}</div>
        </ViewTabSlot>
    </div>
</div>
