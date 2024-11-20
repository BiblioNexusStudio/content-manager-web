<script lang="ts">
    import type { VersionStatusHistory } from '$lib/types/resources';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { getFromApi } from '$lib/utils/http-service';
    import { formatUtcToLocalTimeAndDate } from '$lib/utils/date-time';

    export let resourceContentVersionId: number;
    export let visible: boolean;

    let promise: Promise<VersionStatusHistory[] | null> | null = null;

    $: if (!promise && visible) {
        promise = getFromApi<VersionStatusHistory[]>(
            `/resources/content/versions/${resourceContentVersionId}/status-history`,
            fetch
        );
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
                        <div>
                            <div class="text-gray-500">
                                {formatUtcToLocalTimeAndDate(statusHistory.dateOfEvent)}
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
