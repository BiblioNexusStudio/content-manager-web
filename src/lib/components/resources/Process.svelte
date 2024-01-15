<script lang="ts">
    import { _ as translate } from 'svelte-i18n';
    import type { ResourceContentStatus, ResourceContentStatusEnum } from '$lib/types/base';
    import type { ResourceContentAssignedUser } from '$lib/types/resources';

    export let translationStatus: ResourceContentStatusEnum;
    export let assignedUser: ResourceContentAssignedUser | null;
    export let resourceContentStatuses: ResourceContentStatus[];
</script>

<div class="mb-4 flex grow flex-col rounded-lg border border-base-300 bg-base-200">
    <div class="px-4 py-2 text-xl font-medium">Process</div>
    <div class="h-full overflow-y-scroll rounded-lg bg-white p-4">
        <div class="flex w-full justify-between">
            <div class="flex w-full flex-col">
                <div class="mb-2 flex w-full items-center justify-between">
                    <div class="me-2 font-bold">Status</div>
                    {resourceContentStatuses.find((x) => x.status === translationStatus)?.displayName ??
                        $translate('page.resources.table.statuses.none.value')}
                </div>
                <div class="flex justify-between">
                    <span class="me-2 font-bold">Assigned</span>
                    {#if assignedUser}
                        <span>{assignedUser.name}</span>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
