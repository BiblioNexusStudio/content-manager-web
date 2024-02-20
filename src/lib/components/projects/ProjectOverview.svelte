<script lang="ts">
    import { users, project } from '$lib/stores/projects';
    import Select from '$lib/components/Select.svelte';
    import { UserRole } from '$lib/types/base';
    import ViewTabSlot from './ViewTabSlot.svelte';
    import { updateProject } from '$lib/utils/projects';

    $: currentProjectManager = $users?.find((u) => u.name === $project?.projectManager);
    $: projectManagerUserId = currentProjectManager?.id ?? 0;
    $: currentCompanyLead = $users?.find((u) => u.name === $project?.companyLead);
    $: companyLeadUserId = currentCompanyLead?.id ?? 0;

    let projectManagerSelectValue: string | number | null;
    let companyLeadSelectValue: string | number | null;

    async function handleProjectManagerSelectChange(value: string | number | null) {
        const selectedUser = $users?.find((u) => u.id === value);
        if (selectedUser) {
            await updateProject($project?.id, { projectManagerUserId: selectedUser.id });
            projectManagerSelectValue = value;
        }
    }

    async function handleCompanyLeadSelectChange(value: string | number | null) {
        const selectedUser = $users?.find((u) => u.id === value);
        if (selectedUser) {
            await updateProject($project?.id, { companyLeadUserId: selectedUser.id });
            companyLeadSelectValue = value;
        }
    }
</script>

<div class="my-4 grid min-h-[192px] w-full grid-cols-2 gap-x-8">
    <div class="flex flex-col">
        <ViewTabSlot title="Title">
            <div>{$project?.name ?? ''}</div>
        </ViewTabSlot>
        <ViewTabSlot title="Language">
            <div>{$project?.language ?? ''}</div>
        </ViewTabSlot>
        <ViewTabSlot title="Project Manager">
            {#if $users}
                <Select
                    class="select select-bordered w-full max-w-[50%]"
                    options={[
                        { value: null, label: 'Select User' },
                        ...($users || [])
                            .filter((u) => u.role === UserRole.Publisher)
                            .map((u) => ({ value: u.id, label: u.name })),
                    ]}
                    isNumber={true}
                    value={projectManagerSelectValue || projectManagerUserId}
                    onChange={handleProjectManagerSelectChange}
                />
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
        {#if $project?.projectPlatform === 'Aquifer' && $users}
            <ViewTabSlot title="Company Lead">
                <Select
                    class="select select-bordered w-full max-w-[50%]"
                    options={[
                        { value: null, label: 'Select User' },
                        ...($users || [])
                            .filter((u) => u.role === UserRole.Publisher || u.role === UserRole.Manager)
                            .map((u) => ({ value: u.id, label: u.name })),
                    ]}
                    isNumber={true}
                    value={companyLeadSelectValue || companyLeadUserId}
                    onChange={handleCompanyLeadSelectChange}
                />
            </ViewTabSlot>
        {/if}
    </div>
</div>
