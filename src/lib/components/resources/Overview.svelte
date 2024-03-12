<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import PencilSquareIcon from '$lib/icons/PencilSquareIcon.svelte';
    import XSquareIcon from '$lib/icons/XSquareIcon.svelte';
    import checkCircleO from 'svelte-awesome/icons/checkCircleO';
    import ban from 'svelte-awesome/icons/ban';
    import { createEventDispatcher } from 'svelte';
    import type { ResourceContent, ResourceContentVersion } from '$lib/types/resources';
    import { Permission, userCan } from '$lib/stores/auth';
    import type { ChangeTrackingStore } from '$lib/utils/change-tracking-store';

    export let editableDisplayNameStore: ChangeTrackingStore<string>;
    export let resourceContent: ResourceContent;
    export let resourceContentVersion: ResourceContentVersion;
    export let wordCount: number | null;
    export let isPublished: boolean;
    export let canEdit: boolean;
    const dispatch = createEventDispatcher();

    let displayNameInput: HTMLInputElement;

    let displayNameUpdated = false;
    editableDisplayNameStore.hasChanges.subscribe((hasChanges) => (displayNameUpdated = hasChanges));

    function updateDisplayName(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        editableDisplayNameStore.setUpdated(target.value);
    }

    function saveOnBlur() {
        if (displayNameUpdated) {
            dispatch('saveTitle');
        }
    }
</script>

<div class="mb-4 flex h-fit flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Overview</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        <div class="flex flex-col">
            <div class="mb-2 flex items-center justify-between">
                <div class="flex grow items-center">
                    <div class="me-3 font-bold">Title</div>
                    <div class="grow">
                        {#if canEdit}
                            <input
                                bind:this={displayNameInput}
                                type="text"
                                value={$editableDisplayNameStore.updated}
                                on:change={updateDisplayName}
                                class="input input-ghost h-6 w-full pl-0 text-right"
                                on:blur={() => saveOnBlur()}
                            />
                        {:else}
                            <div class="text-right">{resourceContentVersion.displayName}</div>
                        {/if}
                    </div>
                </div>
                {#if canEdit}
                    <button
                        class="h-6 w-6 p-0"
                        on:click={() => {
                            if (displayNameUpdated) {
                                editableDisplayNameStore.resetToOriginal();
                            } else {
                                displayNameInput.focus();
                            }
                        }}
                        ><label class="swap swap-rotate">
                            <input checked={!displayNameUpdated} type="checkbox" disabled={!displayNameUpdated} />
                            <div class="swap-on text-primary">
                                <PencilSquareIcon />
                            </div>
                            <div class="swap-off text-primary">
                                <XSquareIcon />
                            </div>
                        </label></button
                    >
                {/if}
            </div>
            <div class="mb-2 flex justify-between">
                <span class="me-4 font-bold">Language</span><span
                    >{resourceContent.language.englishDisplay} [{resourceContent.language.iso6393Code}]</span
                >
            </div>
            <div class="mb-2 flex justify-between">
                <span class="me-4 font-bold">Resource</span><span class="text-right"
                    >{resourceContent.parentResourceName}</span
                >
            </div>
            {#if wordCount !== null}
                <div class="mb-2 flex justify-between">
                    <span class="me-4 font-bold">Word Count</span><span>{wordCount}</span>
                </div>
            {/if}
            <div class="mb-2 flex justify-between">
                <span class="me-4 font-bold">Published</span>
                {#if isPublished}
                    <Icon data={checkCircleO} style="height: 28px; width: auto; color: #00a5e0" />
                {:else}
                    <Icon data={ban} style="height: 28px; width: auto; color: #abaeb1" />
                {/if}
            </div>
            {#if resourceContent.project !== null}
                <div class="flex justify-between">
                    <span class="me-4 font-bold">Project</span>
                    {#if $userCan(Permission.ReadProjects)}
                        <a class="btn-link font-bold no-underline" href={`/projects/${resourceContent.project.id}`}
                            >{resourceContent.project.name}</a
                        >
                    {:else}
                        {resourceContent.project.name}
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
