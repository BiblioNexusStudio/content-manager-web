<script lang="ts">
    import type { ProjectResponse } from '$lib/types/projects';

    export let project: ProjectResponse;
</script>

<div class="my-4 grid min-h-[120px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Title</div>
            <div>{project?.name ?? ''}</div>
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Language</div>
            <div>{project?.language ?? ''}</div>
        </div>
    </div>
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Company</div>
            <div>{project?.company ?? ''}</div>
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Platform</div>
            <div>{project?.projectPlatform ?? ''}</div>
        </div>
    </div>
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Project Manager</div>
            <div>{project?.projectManager ?? ''}</div>
        </div>
    </div>
</div>
