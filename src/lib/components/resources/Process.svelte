<script lang="ts">
    import Accordion from './Accordion.svelte';
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

<Accordion title="Process" closable={true}>
    <div class="flex w-full justify-between">
        <div class="flex w-full flex-col">
            <div class="mb-4 flex w-full items-center {$canEdit ? 'justify-between' : ''}">
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
            <div class="mb-4 flex justify-between">
                <span class="me-2 font-bold">Assigned</span>
                {#if assignedUser}
                    <span>{assignedUser.name}</span>
                {/if}
            </div>
        </div>
        {#if hasAudio}
            <div class="flex flex-col">
                <div class="mb-4">
                    <Icon data={volumeUp} scale={2} />
                </div>
                <div class="mb-4">Yes</div>
            </div>
        {/if}
    </div>
</Accordion>
