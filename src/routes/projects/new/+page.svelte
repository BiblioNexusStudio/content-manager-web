<script lang="ts">
    import { goto } from '$app/navigation';
    import Modal from '$lib/components/Modal.svelte';
    import Select from '$lib/components/Select.svelte';
    import { log } from '$lib/logger';
    import { UserRole } from '$lib/types/base';
    import { getFromApi } from '$lib/utils/http-service';
    import type { HttpError } from '@sveltejs/kit';
    import type { PageData } from './$types';
    import ProjectContentSelector from './ProjectContentSelector.svelte';
    import { ProjectConstants } from '$lib/types/projects';
    import BackButton from '$lib/components/BackButton.svelte';

    export let data: PageData;

    const { languages, users, projectPlatforms, companies } = data;

    let title = '';
    let languageId: number | null = null;
    let projectManagerUserId: number | null = null;
    let companyId: number | null = null;
    let platformId: number | null = null;
    let companyLeadUserId: number | null = null;
    let selectedResourceIds: number[] = [];
    let isSaving = false;
    let isShowingErrorModal = false;
    let errorMessage = '';

    $: !isShowingErrorModal && (errorMessage = '');

    $: isForAquiferization = (languages || []).find((l) => l.id === languageId)?.iso6393Code === 'eng';
    $: requiresCompanyLead = projectPlatforms?.find((p) => p.id === platformId)?.name === ProjectConstants.AQUIFER;
    $: !requiresCompanyLead && (companyLeadUserId = null);

    $: canSave =
        !!title &&
        !!languageId &&
        !!projectManagerUserId &&
        !!companyId &&
        !!platformId &&
        (!requiresCompanyLead || !!companyLeadUserId) &&
        selectedResourceIds.length > 0;

    async function save() {
        isSaving = true;
        try {
            const project = await getFromApi<{ id: number }>('/projects', {
                method: 'POST',
                body: {
                    title,
                    languageId,
                    projectManagerUserId,
                    companyId,
                    projectPlatformId: platformId,
                    companyLeadUserId,
                    resourceIds: selectedResourceIds,
                },
            });
            if (!project) {
                throw new Error('No project created');
            }
            await goto(`/projects/${project.id}`);
        } catch (error) {
            log.exception(error as Error);
            // TODO: make this less hacky, need a better way to propagate errors and parse the message instead of this `includes`
            if ((error as HttpError)?.body?.message?.includes('project with this title already exists')) {
                errorMessage = 'A project with this name already exists.';
            }
            isShowingErrorModal = true;
        } finally {
            isSaving = false;
        }
    }
</script>

<div class="relative flex h-screen flex-col overflow-hidden px-8 py-4 short:h-full short:overflow-auto">
    <div class="mb-4 flex flex-row items-center">
        <BackButton defaultPathIfNoHistory="/projects" />
        <div class="text-3xl">Create Project</div>
    </div>
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
                    ...(languages || []).map((l) => ({
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
                    ...(companies || []).filter((c) => c.name !== 'N/A').map((c) => ({ value: c.id, label: c.name })),
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
        <!-- the key ensures we reset the project content selection when language changes -->
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
    <div class="absolute bottom-0 left-0 right-0 z-50 flex flex-row border-t bg-white p-4">
        <div class="flex-grow"></div>
        <button class="btn btn-primary" on:click={save} disabled={!canSave}>
            {#if isSaving}
                <span class="loading loading-spinner" />
            {:else}
                Create
            {/if}
        </button>
    </div>
</div>

<Modal
    isError={true}
    header="Error creating"
    description={errorMessage || 'There was an error while saving.'}
    bind:open={isShowingErrorModal}
/>
