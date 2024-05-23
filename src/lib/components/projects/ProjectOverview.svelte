<script lang="ts">
    import { users, project } from '$lib/stores/projects';
    import Select from '$lib/components/Select.svelte';
    import { UserRole } from '$lib/types/base';
    import ViewTabSlot from './ViewTabSlot.svelte';
    import { updateProject } from '$lib/utils/projects';
    import { ProjectConstants } from '$lib/types/projects';
    import { Permission, userCan } from '$lib/stores/auth';

    $: currentProjectManager = $users?.find((u) => u.name === $project?.projectManager);
    $: projectManagerUserId = currentProjectManager?.id ?? 0;
    $: currentCompanyLead = $users?.find((u) => u.name === $project?.companyLead);
    $: companyLeadUserId = currentCompanyLead?.id ?? 0;

    async function handleProjectManagerSelectChange(value: string | number | null) {
        const selectedUser = $users?.find((u) => u.id === value);
        if (selectedUser) {
            await updateProject($project?.id, { projectManagerUserId: selectedUser.id });
            $project && ($project.projectManager = selectedUser.name);
        }
    }

    async function handleCompanyLeadSelectChange(value: string | number | null) {
        const selectedUser = $users?.find((u) => u.id === value);
        if (selectedUser) {
            await updateProject($project?.id, { companyLeadUserId: selectedUser.id });
            $project && ($project.companyLead = selectedUser.name);
        }
    }
</script>

<div
    class="my-4 grid {$userCan(Permission.ReadProjects) ? 'min-h-[192px]' : 'min-h-[96px]'}  w-full grid-cols-2 gap-x-8"
>
    <div class="flex flex-col">
        <ViewTabSlot title="Title">
            <div>{$project?.name ?? ''}</div>
        </ViewTabSlot>
        <ViewTabSlot title="Language">
            <div>{$project?.language ?? ''}</div>
        </ViewTabSlot>
        <ViewTabSlot title="Project Manager">
            {#if $users && $userCan(Permission.ReadProjects)}
                <Select
                    class="select select-bordered w-full max-w-[50%]"
                    options={[
                        ...($users || [])
                            .filter((u) => u.role === UserRole.Publisher)
                            .map((u) => ({ value: u.id, label: u.name })),
                    ]}
                    isNumber={true}
                    value={projectManagerUserId}
                    onChange={handleProjectManagerSelectChange}
                />
            {:else}
                <div>{$project?.projectManager}</div>
            {/if}
        </ViewTabSlot>
    </div>
    <div class="flex flex-col">
        <ViewTabSlot title="Company">
            <div>{$project?.company ?? ''}</div>
        </ViewTabSlot>
        <ViewTabSlot title="Platform">
            <div>{$project?.projectPlatform ?? ''}</div>
        </ViewTabSlot>
        {#if $project?.projectPlatform === ProjectConstants.AQUIFER && $users}
            <ViewTabSlot title="Company Lead">
                {#if $project?.started === null}
                    <Select
                        class="select select-bordered w-full max-w-[50%]"
                        options={[
                            ...($users || [])
                                .filter((u) => u.role === UserRole.Publisher || u.role === UserRole.Manager)
                                .map((u) => ({ value: u.id, label: u.name })),
                        ]}
                        isNumber={true}
                        value={companyLeadUserId}
                        onChange={handleCompanyLeadSelectChange}
                    />
                {:else}
                    {$project.companyLead}
                {/if}
            </ViewTabSlot>
        {/if}
    </div>
</div>
