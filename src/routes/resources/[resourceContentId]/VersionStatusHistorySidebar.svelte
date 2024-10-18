<script lang="ts">
    import type { VersionStatusHistory } from '$lib/types/resources';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { getFromApiWithoutBlocking } from '$lib/utils/http-service';

    export let resourceContentVersionId: number;
    export let visible: boolean;

    $: if (!promise && visible) {
        promise = getStatusHistory();
    }

    let promise: Promise<VersionStatusHistory[]> | null = null;

    async function getStatusHistory() {
        let statusHistoryEvents = getFromApiWithoutBlocking<VersionStatusHistory[]>(
            `/resources/content/versions/${resourceContentVersionId}/status-history`,
            fetch
        );

        return statusHistoryEvents.promise;
    }
</script>

{#await promise}
    <CenteredSpinner />
{:then fetched}
    {#if fetched}
        <div class="overflow-y-auto">
            <div class="m-4 flex flex-col justify-center gap-3">
                {#if fetched.length === 0}
                    <div>No Status History.</div>
                {:else}
                    <div class="flex justify-center text-lg font-semibold" dir="auto">History</div>
                    {#each fetched as statusHistory (statusHistory)}
                        {@const date = new Date(statusHistory.dateOfEvent + 'Z')}
                        <div>
                            <div class="text-gray-500">
                                {date.toLocaleDateString('en-us', {
                                    month: 'short',
                                    day: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true,
                                })}
                            </div>
                            <div class="mt-2 text-gray-500">{statusHistory.event}</div>
                            <hr />
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    {/if}
{/await}
