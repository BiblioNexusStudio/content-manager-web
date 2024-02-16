<script lang="ts">
    import { users, project } from '$lib/stores/projects';
    import Select from '$lib/components/Select.svelte';
    import { UserRole } from '$lib/types/base';

    $: projectManagerUserId = $project?.projectManager ?? 0;
</script>

<div class="my-4 grid min-h-[120px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Title</div>
            <div>{$project?.name ?? ''}</div>
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Language</div>
            <div>{$project?.language ?? ''}</div>
        </div>
    </div>
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Company</div>
            <div>{$project?.company ?? ''}</div>
        </div>
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Platform</div>
            <div>{$project?.projectPlatform ?? ''}</div>
        </div>
    </div>
    <div class="flex flex-col">
        <div class="mb-4 flex justify-between">
            <div class="font-bold">Project Manager</div>
            {#if $project?.started === null && $users}
                <Select
                    class="select select-bordered w-full max-w-[50%]"
                    options={[
                        { value: null, label: 'Select User' },
                        ...($users || [])
                            .filter((u) => u.role === UserRole.Publisher)
                            .map((u) => ({ value: u.id, label: u.name })),
                    ]}
                    isNumber={true}
                    bind:value={projectManagerUserId}
                />
            {:else}
                <div>{$project?.projectManager ?? ''}</div>
            {/if}
        </div>
    </div>
</div>
