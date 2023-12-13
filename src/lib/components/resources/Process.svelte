<script lang="ts">
    import { Icon } from 'svelte-awesome';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import { _ as translate } from 'svelte-i18n';
    import type { ResourceContentStatus, ResourceContentStatusEnum } from '$lib/types/base';
    import type { ResourceContentAssignedUser } from '$lib/types/resources';

    export let translationStatus: ResourceContentStatusEnum;
    export let hasAudio: boolean;
    export let assignedUser: ResourceContentAssignedUser | null;
    export let resourceContentStatuses: ResourceContentStatus[];
</script>

<div class="mb-4 flex max-h-[calc(21%-16px)] grow flex-col rounded-lg border border-base-300 bg-base-200">
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
