<script lang="ts">
    import type { HelpDocumentResponse } from '$lib/types/helpDocuments';
    import { fly } from 'svelte/transition';
    import List from './List.svelte';
    import { onMount } from 'svelte';
    import { getFromApi } from '$lib/utils/http-service';

    let isLoading = true;
    let helpDocuments: HelpDocumentResponse | null = null;
    export let isShowHelpModal: boolean;

    function close() {
        isShowHelpModal = false;
    }

    async function fetchHelpDocuments(): Promise<HelpDocumentResponse | null> {
        try {
            let helpDocResponse = await getFromApi<HelpDocumentResponse>('/help/aquifer-cms/documents', fetch);
            return helpDocResponse;
        } finally {
            isLoading = false;
        }
    }

    onMount(async () => {
        helpDocuments = await fetchHelpDocuments();
    });
</script>

<svelte:window
    on:keydown={(e) => {
        if (e.key === 'Escape') close();
    }}
/>

<div class="absolute inset-0 z-50 bg-white p-8" transition:fly={{ duration: 250 }}>
    <div class="flex items-center justify-between">
        <h1 class="mb-4 text-3xl">Help</h1>
        <button class="btn btn-circle btn-ghost btn-sm" on:click={close}>✕</button>
    </div>

    {#if isLoading}
        <section class="mb-4">
            <h2 class="text-xl">Recent Releases</h2>
            <ul class="flex flex-wrap gap-x-10 p-4">
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
            </ul>
        </section>

        <section class="mb-4">
            <h2 class="text-xl">How-To</h2>
            <ul class="flex flex-wrap gap-x-10 p-4">
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="flex h-32 w-20 flex-col gap-4">
                    <div class="skeleton h-20 w-full"></div>
                    <div class="skeleton h-4 w-full"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
            </ul>
        </section>
    {:else if helpDocuments}
        <section class="mb-4">
            <h2 class="text-xl">Recent Releases</h2>
            <List documents={helpDocuments?.releases} />
        </section>

        <section class="mb-4">
            <h2 class="text-xl">How-To</h2>
            <List documents={helpDocuments?.howTos} />
        </section>
    {:else}
        <h2 class="text-xl">Something went wrong. Please try again later.</h2>
    {/if}
</div>
