<script lang="ts">
    import Select from '$lib/components/Select.svelte';
    import { UserRole } from '$lib/types/base';
    import type { PageData } from './$types';
    import ProjectContentSelector from './ProjectContentSelector.svelte';

    export let data: PageData;

    const { languages, users, projectPlatforms, companies } = data;

    let title = '';
    let languageId: number | null = null;
    let projectManagerUserId: number | null = null;
    let companyId: number | null = null;
    let platformId: number | null = null;
    let companyLeadUserId: number | null = null;
    let selectedResourceIds: number[] = [];

    $: isForAquiferization = languages.find((l) => l.id === languageId)?.iso6393Code === 'eng';
    $: requiresCompanyLead = projectPlatforms?.find((p) => p.id === platformId)?.name === 'Aquifer';
</script>

<div class="flex h-screen flex-col overflow-hidden px-8 py-4 short:h-full short:overflow-auto">
    <div class="mb-4 text-3xl">Create Project</div>
    <div class="mb-8 flex flex-col">
        <div class="pb-2 text-lg font-bold">Basic Information</div>
        <div class="flex flex-row items-center border-b border-t p-2">
            <div class="text-md">Title <span class="text-error">*</span></div>
            <div class="flex-grow"></div>
            <input class="input input-bordered w-full max-w-[50%]" bind:value={title} />
        </div>
        <div class="flex flex-row items-center border-b p-2">
            <div class="text-md">Language <span class="text-error">*</span></div>
            <div class="flex-grow"></div>
            <Select
                class="select select-bordered w-full max-w-[50%]"
                disabled={selectedResourceIds.length > 0}
                options={[
                    { value: null, label: 'Select Language' },
                    ...languages.map((l) => ({
                        value: l.id,
                        label: l.iso6393Code === 'eng' ? 'English (Aquiferize)' : l.englishDisplay,
                    })),
                ]}
                isNumber={true}
                bind:value={languageId}
            />
        </div>
        <div class="flex flex-row items-center border-b p-2">
            <div class="text-md">Project Manager <span class="text-error">*</span></div>
            <div class="flex-grow"></div>
            <Select
                class="select select-bordered w-full max-w-[50%]"
                options={[
                    { value: null, label: 'Select User' },
                    ...(users || [])
                        .filter((u) => u.role === UserRole.Publisher)
                        .map((u) => ({ value: u.id, label: u.name })),
                ]}
                isNumber={true}
                bind:value={projectManagerUserId}
            />
        </div>
        <div class="flex flex-row items-center border-b p-2">
            <div class="text-md">Company <span class="text-error">*</span></div>
            <div class="flex-grow"></div>
            <Select
                class="select select-bordered w-full max-w-[50%]"
                options={[
                    { value: null, label: 'Select Company' },
                    ...(companies || []).map((c) => ({ value: c.id, label: c.name })),
                ]}
                isNumber={true}
                bind:value={companyId}
            />
        </div>
        <div class="flex flex-row items-center border-b p-2">
            <div class="text-md">Platform <span class="text-error">*</span></div>
            <div class="flex-grow"></div>
            <Select
                class="select select-bordered w-full max-w-[50%]"
                options={[
                    { value: null, label: 'Select Platform' },
                    ...(projectPlatforms || []).map((c) => ({ value: c.id, label: c.name })),
                ]}
                isNumber={true}
                bind:value={platformId}
            />
        </div>
        <div class="border-b p-2">
            <div class="{!requiresCompanyLead && 'contrast-0'} flex flex-row items-center">
                <div class="text-md">Company Lead <span class="text-error">*</span></div>
                <div class="flex-grow"></div>
                <Select
                    disabled={!requiresCompanyLead}
                    class="select select-bordered w-full max-w-[50%] {!requiresCompanyLead && '!bg-transparent'}"
                    options={[
                        { value: null, label: 'Select User' },
                        ...(users || [])
                            .filter((u) => u.role === UserRole.Publisher || u.role === UserRole.Manager)
                            .map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    isNumber={true}
                    bind:value={companyLeadUserId}
                />
            </div>
        </div>
    </div>
    <div class="flex flex-col overflow-hidden short:h-[30rem]">
        <div class="text-lg font-bold">Add Content</div>
        <!-- ensure we reset the project content selection when language changes -->
        {#key languageId}
            <ProjectContentSelector
                disabled={!languageId}
                {languageId}
                {data}
                {isForAquiferization}
                bind:finalizedResourceIds={selectedResourceIds}
            />
        {/key}
    </div>
</div>
