<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import type { ResourceContentStatus } from '$lib/types/base';
    import type { ResourceContent } from '$lib/types/resources';
    import { Icon } from 'svelte-awesome';
    import checkCircleO from 'svelte-awesome/icons/checkCircleO';
    import ban from 'svelte-awesome/icons/ban';
    import StatusColor from './StatusColor.svelte';

    export let resourceContent: ResourceContent;

    export let resourceContentStatuses: ResourceContentStatus[];
</script>

<div class="mb-6 flex w-full justify-between">
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
                <StatusColor status={resourceContent.status} />
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
    <div class="flex flex-col">
        <!-- Placeholder for show versions and show comments icons -->
        <div class="mb-2 h-9" />
        <!-- Placeholder for show versions and show comments icons -->
        {#if resourceContent.assignedUser}
            <div class="flex justify-end text-xl">
                Assigned: {resourceContent.assignedUser.name}
            </div>
        {/if}
    </div>
</div>
