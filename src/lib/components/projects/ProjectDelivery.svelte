<script lang="ts">
    import { formatDate } from '$lib/utils/projects';
    import DatePicker from '../DatePicker.svelte';
    import { project } from '$lib/stores/projects';
    import ViewTabSlot from './ViewTabSlot.svelte';
    import { updateProject } from '$lib/utils/projects';

    function updateProjectedCompanyDeliveryDate(date: string) {
        if ($project) {
            updateProject($project?.id, { projectedDeliveryDate: date });
            $project.projectedDeliveryDate = date;
        }
    }

    function updateProjectedPublishDate(date: string) {
        if ($project) {
            updateProject($project?.id, { projectedPublishDate: date });
            $project.projectedPublishDate = date;
        }
    }
</script>

<div class="my-4 grid min-h-[192px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <ViewTabSlot title="Projected Company Delivery Date">
            {#if $project?.started === null}
                <DatePicker
                    callback={updateProjectedCompanyDeliveryDate}
                    date={$project?.projectedDeliveryDate ?? ''}
                />
            {:else}
                <div>{formatDate($project?.projectedDeliveryDate)}</div>
            {/if}
        </ViewTabSlot>
        <ViewTabSlot title="Actual Company Devlivery Date">
            <div>{formatDate($project?.actualDeliveryDate)}</div>
        </ViewTabSlot>
    </div>
    <div class="flex flex-col">
        <ViewTabSlot title="Projected Publish Date">
            {#if $project?.started === null}
                <DatePicker callback={updateProjectedPublishDate} date={$project?.projectedPublishDate ?? ''} />
            {:else}
                <div>{formatDate($project?.projectedPublishDate)}</div>
            {/if}
        </ViewTabSlot>
        <ViewTabSlot title="Actual Publish Date">
            <div>{formatDate($project?.actualPublishDate)}</div>
        </ViewTabSlot>
    </div>
</div>
