<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import { setOriginalValues, updateValues } from '$lib/stores/tiptapContent';
    import { canEdit } from '$lib/stores/auth';
    import { _ as translate } from 'svelte-i18n';
    import type { ResourceContentStatus, ResourceContentStatusEnum } from '$lib/types/base';
    import type { ResourceContentAssignedUser } from '$lib/types/resources';

    export let translationStatus: ResourceContentStatusEnum;
    export let hasAudio: boolean;
    export let assignedUser: ResourceContentAssignedUser | null;
    export let resourceContentStatuses: ResourceContentStatus[];

    setOriginalValues({ status: translationStatus });
    $: updateValues({ status: translationStatus });
</script>

<div class="mb-4 flex h-[calc(20%-16px)] grow flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="p-4 text-xl font-medium">Process</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white px-4 py-2">
        <div class="flex w-full justify-between">
            <div class="flex w-full flex-col">
                <div class="mb-2 flex w-full items-center {$canEdit ? 'justify-between' : ''}">
                    <div class="me-2 font-bold">Status</div>
                    {#if $canEdit}
                        <select bind:value={translationStatus} class="select select-ghost select-sm me-2 max-w-xs">
                            {#each resourceContentStatuses as { status, displayName }}
                                <option value={status}>{displayName}</option>
                            {/each}
                        </select>
                    {:else}
                        {resourceContentStatuses.find((x) => x.status === translationStatus)?.displayName ??
                            $translate('page.resources.table.statuses.none.value')}
                    {/if}
                </div>
                <div class="flex justify-between">
                    <span class="me-2 font-bold">Assigned</span>
                    {#if assignedUser}
                        <span>{assignedUser.name}</span>
                    {/if}
                </div>
            </div>
            {#if hasAudio}
                <div class="flex flex-col">
                    <div class="mb-2">
                        <Icon data={volumeUp} scale={2} />
                    </div>
                    <div>Yes</div>
                </div>
            {/if}
        </div>
    </div>
</div>
