<script lang="ts">
    import Select from '$lib/components/Select.svelte';
    import { Role } from '$lib/stores/auth';
    import type { PageData } from './$types';
    import ProjectContentSelector from './ProjectContentSelector.svelte';

    export let data: PageData;

    const { languages } = data;

    const users = [
        { id: 1, name: 'Ben A', roles: [Role.Publisher] },
        { id: 2, name: 'Kyle Grinstead', roles: [Role.Editor] },
        { id: 3, name: 'Other Guy', roles: [] },
    ];

    const companies = [
        { id: 1, name: 'Accent Network' },
        { id: 2, name: 'BCS' },
        { id: 3, name: 'BiblioNexus' },
        { id: 4, name: 'Christian Lingua' },
        { id: 5, name: 'Internal' },
        { id: 6, name: 'Lilt' },
        { id: 7, name: 'MVH' },
        { id: 8, name: 'Prediction Guard' },
        { id: 9, name: 'TextTree' },
        { id: 10, name: 'Wycliffe Global Partners' },
    ];

    const platforms = [
        { id: 1, name: 'Aquifer' },
        { id: 2, name: 'Crowdin' },
        { id: 3, name: 'Lilt' },
        { id: 5, name: 'SmartCAT' },
        { id: 6, name: 'Other' },
    ];

    let title = '';
    let languageId: number | null = null;
    let projectManagerUserId: number | null = null;
    let companyId: number | null = null;
    let platformId: number | null = null;
    let companyLeadUserId: number | null = null;
    let selectedResourceContentIds: number[] = [];

    $: isForAquiferization = languages.find((l) => l.id === languageId)?.iso6393Code === 'eng';
    $: requiresCompanyLead = platforms.find((p) => p.id === platformId)?.name === 'Aquifer';
</script>

<div class="flex flex-col p-8">
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
                disabled={selectedResourceContentIds.length > 0}
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
                        .filter((u) => u.roles.includes(Role.Publisher))
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
                    ...(platforms || []).map((c) => ({ value: c.id, label: c.name })),
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
                            .filter((u) => u.roles.includes(Role.Publisher) || u.roles.includes(Role.Manager))
                            .map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    isNumber={true}
                    bind:value={companyLeadUserId}
                />
            </div>
        </div>
    </div>
    <div class="flex flex-col">
        <div class="text-lg font-bold">Add Content</div>
        <!-- ensure we reset the project content selection when language changes -->
        {#key languageId}
            <ProjectContentSelector
                disabled={!languageId}
                {data}
                {isForAquiferization}
                bind:finalizedResourceContentIds={selectedResourceContentIds}
            />
        {/key}
    </div>
</div>
