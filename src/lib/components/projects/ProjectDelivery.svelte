<script lang="ts">
    import type { ProjectResponse } from '$lib/types/projects';
    import { formatDate } from '$lib/utils/projects';

    export let project: ProjectResponse;
</script>

<div class="my-4 grid min-h-[120px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Projected Company Delivery Date</div>
            <div>{formatDate(project.projectedDeliveryDate)}</div>
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Actual Compnay Devlivery Date</div>
            <div>{formatDate(project.actualDeliveryDate)}</div>
        </div>
    </div>
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Projected Publish Date</div>
            <div>{formatDate(project.projectedPublishDate)}</div>
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Actual Publish Devlivery Date</div>
            <div>{formatDate(project.projectedDeliveryDate)}</div>
        </div>
    </div>
</div>
