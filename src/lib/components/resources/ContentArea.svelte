<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { statusColorMap, type ResourceContentStatus, ResourceContentStatusEnum } from '$lib/types/base';
    import { MediaTypeEnum, type ResourceContent } from '$lib/types/resources';
    import { Icon } from 'svelte-awesome';
    import checkCircleO from 'svelte-awesome/icons/checkCircleO';
    import ban from 'svelte-awesome/icons/ban';
    import Tooltip from '../Tooltip.svelte';
    import HistoryIcon from '$lib/icons/HistoryIcon.svelte';

    export let resourceContent: ResourceContent;
    export let selectedSnapshotId: number | null;
    export let onToggleHistoryPane: () => void;
    export let resourceContentStatuses: ResourceContentStatus[];

    $: statusColor = statusColorMap[resourceContent.status];
</script>

<div class="my-6 flex w-full justify-between">
    <div class="flex flex-col">
        <div class="mb-2 flex text-xl">
            <h1 class="me-4 text-3xl font-bold">{resourceContent.englishLabel}</h1>
            <div class="flex items-end">{resourceContent.parentResourceName}</div>
        </div>
        <div class="flex text-xl">
            <div class="me-4">
                {resourceContent.language.englishDisplay}
            </div>
            <div class="me-4 flex items-center">
                <div class="status-color me-1 h-4 w-4 rounded-full" style="background-color: {statusColor};"></div>
                {resourceContentStatuses.find((x) => x.status === resourceContent.status)?.displayName ??
                    $translate('page.resources.table.statuses.none.value')}
            </div>
            <div class="relative flex items-center">
                {#if resourceContent.hasPublishedVersion}
                    <div class="group flex items-center">
                        <Icon data={checkCircleO} style="height: 20px; width: auto; color: #17b26a;" />
                        <div
                            class="absolute bottom-2 left-4 ms-1 hidden whitespace-nowrap rounded-xl border-2 border-[#17b26a] px-2 text-sm font-bold text-[#17b26a] group-hover:block"
                        >
                            Published
                        </div>
                    </div>
                {:else}
                    <div class="group flex items-center">
                        <Icon data={ban} style="height: 20px; width: auto; color: #485467;" />
                        <div
                            class="absolute bottom-2 left-4 ms-1 hidden whitespace-nowrap rounded-xl border-2 border-[#485467] px-2 text-sm font-bold text-[#485467] group-hover:block"
                        >
                            Not Published
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
    <div class="flex flex-col items-end space-y-2">
        {#if resourceContent.mediaType === MediaTypeEnum.text}
            <Tooltip
                position={{ right: '3rem', top: '0rem' }}
                class="rounded-md bg-[#e6f7fc] p-2"
                text={selectedSnapshotId === null ? 'Show Versions' : 'Hide Versions'}
            >
                <button
                    class="btn btn-ghost btn-sm {selectedSnapshotId !== null && 'bg-[#e6f7fc]'}"
                    on:click={onToggleHistoryPane}><HistoryIcon /></button
                >
            </Tooltip>
        {/if}
        {#if resourceContent.assignedUser}
            <div class="flex text-xl">
                Assigned: {resourceContent.assignedUser.name}
            </div>
        {:else if resourceContent.status === ResourceContentStatusEnum.AquiferizeInProgress || resourceContent.status === ResourceContentStatusEnum.TranslationInProgress}
            <div class="flex text-xl">Assigned: External User</div>
        {/if}
    </div>
</div>
