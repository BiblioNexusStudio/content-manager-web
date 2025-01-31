<script lang="ts">
    import { getContext, onMount } from 'svelte';
    import MarkPopout from '$lib/components/editorMarkPopouts/MarkPopout.svelte';
    import CenteredSpinner from '$lib/components/CenteredSpinner.svelte';
    import { getFromApi } from '$lib/utils/http-service';
    import type { ParentResource } from '$lib/types/base';

    let markSpan: HTMLElement | null;
    let show = false;
    let container: HTMLDivElement | undefined;
    let bubblingClick = false;
    let resourceReference: ResourceReference | null = null;
    let parentResource: ParentResource | null = null;
    let errorMessage: string | null = null;

    interface ResourceReference {
        resourceId: number;
        englishLabel: number;
    }
    const parentResources = getContext<() => ParentResource[]>('parentResources');

    onMount(() => {
        window.onResourceReferenceClick = async (spanId, resourceType, resourceId) => {
            parentResource = parentResources().find((p) => p.code === resourceType) ?? null;
            resourceReference = null;
            markSpan = document.getElementById(spanId);
            bubblingClick = true;
            show = true;
            errorMessage = null;
            const resourceIdNumber = parseInt(resourceId);
            if (resourceIdNumber && parentResource) {
                try {
                    resourceReference = await getFromApi<ResourceReference>(
                        `/resources/resource-references?parentResourceId=${parentResource.id}&resourceId=${resourceIdNumber}`
                    );
                } catch (e) {
                    errorMessage = 'Error occurred, try again';
                    throw e;
                }
            } else {
                errorMessage = 'Unable to load resource details. Invalid resource link.';
            }
        };
    });

    const onAnyClick = (e: MouseEvent) => {
        if (bubblingClick) {
            bubblingClick = false;
            return;
        }

        if (container) {
            show = container.contains(e.target as Node);
        }
    };
</script>

<svelte:window on:click={onAnyClick} />

{#if resourceReference}
    <MarkPopout bind:show bind:markSpan bind:container>
        <div class="overflow-y-auto" dir="auto">
            <div class="m-4 flex flex-col justify-center space-y-2">
                <div class="text-lg font-bold">
                    {resourceReference.englishLabel}
                </div>
                <div class="text-md">
                    {parentResource?.displayName}
                </div>
            </div>
        </div>
    </MarkPopout>
{:else}
    <MarkPopout bind:show bind:markSpan bind:container>
        <div class="m-4 flex flex-col justify-center space-y-2">
            {#if errorMessage}
                {errorMessage}
            {:else}
                <CenteredSpinner />
            {/if}
        </div>
    </MarkPopout>
{/if}
