<script lang="ts">
    import { users, project } from '$lib/stores/projects';

    function changeProjectManager(selectValue: Event & { currentTarget: EventTarget & HTMLSelectElement }) {
        console.log(selectValue?.currentTarget?.value);
    }
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
                <select
                    class="rounded border ps-4"
                    value={$project?.projectManager ?? ''}
                    on:change={(v) => changeProjectManager(v)}
                >
                    {#each $users as user}
                        <option value={user.id}>{user.name}</option>
                    {/each}
                </select>
            {:else}
                <div>{$project?.projectManager ?? ''}</div>
            {/if}
        </div>
    </div>
</div>
