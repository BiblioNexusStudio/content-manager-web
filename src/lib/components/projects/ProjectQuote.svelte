<script lang="ts">
    import type { ProjectResponse } from '$lib/types/projects';

    export let project: ProjectResponse;
</script>

<div class="my-4 grid min-h-[120px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Source Words</div>
            <div>{project?.sourceWordCount ?? ''}</div>
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Efective Words</div>
            <div>{project?.effectiveWordCount ?? ''}</div>
        </div>
    </div>
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Quoted Cost</div>
            <div>{project?.quotedCost ?? ''}</div>
        </div>
    </div>
</div>
