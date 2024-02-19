<script lang="ts">
    import { users, project } from '$lib/stores/projects';
    import Select from '$lib/components/Select.svelte';
    import { UserRole } from '$lib/types/base';
    import ViewTabSlot from './ViewTabSlot.svelte';

    $: currentProjectManager = $users?.find((u) => u.name === $project?.projectManager);
    $: projectManagerUserId = currentProjectManager?.id ?? 0;

    let test: number = projectManagerUserId;
</script>

<div class="my-4 grid min-h-[192px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <ViewTabSlot title="Title">
            <div>{$project?.name ?? ''}</div>
        </ViewTabSlot>
        <ViewTabSlot title="Language">
            <div>{$project?.language ?? ''}</div>
        </ViewTabSlot>
    </div>
    <div class="flex flex-col">
        <ViewTabSlot title="Company">
            <div>{$project?.company ?? ''}</div>
        </ViewTabSlot>
        <ViewTabSlot title="Platform">
            <div>{$project?.projectPlatform ?? ''}</div>
        </ViewTabSlot>
    </div>
    <div class="flex flex-col">
        <ViewTabSlot title="Project Manager">
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
                    bind:value={test}
                />
            {:else}
                <div>{$project?.projectManager ?? ''}</div>
            {/if}
        </ViewTabSlot>
    </div>
</div>
