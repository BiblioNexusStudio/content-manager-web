<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import { statusColorMap, type ResourceContentStatus, type ResourceContentStatusEnum } from '$lib/types/base';
    import type { ResourceContentAssignedUser } from '$lib/types/resources';
    import { Icon } from 'svelte-awesome';
    import checkCircleO from 'svelte-awesome/icons/checkCircleO';
    import ban from 'svelte-awesome/icons/ban';

    export let translationStatus: ResourceContentStatusEnum;
    export let resourceContentStatuses: ResourceContentStatus[];
    export let assignedUser: ResourceContentAssignedUser | null;

    export let englishLabel: string;
    export let parentResourceName: string;
    export let languageDisplay: string;
    export let published: boolean;

    $: statusColor = statusColorMap[translationStatus];
</script>

<div class="mb-6 flex w-full justify-between">
    <div class="flex flex-col">
        <div class="mb-2 flex text-xl">
            <h1 class="me-4 text-3xl font-bold">{englishLabel}</h1>
            <div class="flex items-end">{parentResourceName}</div>
        </div>
        <div class="flex text-xl">
            <div class="me-4">
                {languageDisplay}
            </div>
            <div class="me-4 flex items-center">
                <div class="status-color me-1 h-4 w-4 rounded-full" style="background-color: {statusColor};"></div>
                {resourceContentStatuses.find((x) => x.status === translationStatus)?.displayName ??
                    $translate('page.resources.table.statuses.none.value')}
            </div>
            <div class="relative flex items-center">
                {#if published}
                    <div class="tooltip-container flex items-center">
                        <Icon data={checkCircleO} style="height: 20px; width: auto; color: #17b26a;" />
                        <div
                            class="published-tooltip absolute bottom-2 left-4 ms-1 hidden whitespace-nowrap rounded-xl border-2 border-[#17b26a] px-2 text-sm font-bold text-[#17b26a]"
                        >
                            Published
                        </div>
                    </div>
                {:else}
                    <div class="tooltip-container flex items-center">
                        <Icon data={ban} style="height: 20px; width: auto; color: #485467;" />
                        <div
                            class="published-tooltip absolute bottom-2 left-4 ms-1 hidden whitespace-nowrap rounded-xl border-2 border-[#485467] px-2 text-sm font-bold text-[#485467]"
                        >
                            Not Published
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
    <div class="flex flex-col">
        <!-- Placeholder for show versions and show comments icons -->
        <div class="mb-2 h-9" />
        <!-- Placeholder for show versions and show comments icons -->
        {#if assignedUser}
            <div class="flex justify-end text-xl">
                Assigned: {assignedUser.name}
            </div>
        {/if}
    </div>
</div>

<style>
    .tooltip-container:hover .published-tooltip {
        display: block;
    }
</style>
