<script lang="ts">
    import List from '$lib/components/help/List.svelte';
    import type { HelpDocumentResponse } from '$lib/types/helpDocuments';
    import { fly } from 'svelte/transition';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let helpDocuments: HelpDocumentResponse | null = $state(null);

    const loadHelpContents = async () => {
        helpDocuments = await data.helpContents.promise;
    };
</script>

<svelte:head>
    <title>Help | Aquifer Admin</title>
</svelte:head>

<div class="absolute inset-0 bg-white p-8" transition:fly={{ duration: 250 }}>
    <div class="flex items-center justify-between">
        <h1 class="mb-4 text-3xl">Help</h1>
    </div>
    {#await loadHelpContents()}
        <section class="mb-4">
            <h2 class="text-xl">Recent Releases</h2>
            <ul class="flex flex-wrap gap-x-6 gap-y-6 p-4">
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
            </ul>
        </section>

        <section class="mb-4">
            <h2 class="text-xl">How-To</h2>
            <ul class="flex flex-wrap gap-x-6 gap-y-6 p-4">
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
                <div class="overflow flex h-32 w-40 flex-col items-center gap-y-2">
                    <span class="skeleton h-16 w-16"></span>
                    <div class="skeleton h-4 w-3/4"></div>
                    <div class="skeleton h-4 w-14"></div>
                </div>
            </ul>
        </section>
    {:then}
        <section class="mb-4">
            <h2 class="text-xl">Recent Releases</h2>
            <List documents={helpDocuments?.releases} />
        </section>

        <section class="mb-4">
            <h2 class="text-xl">How-To</h2>
            <List documents={helpDocuments?.howTos} />
        </section>
    {:catch}
        <h2 class="text-xl">Something went wrong. Please try again later.</h2>
    {/await}
</div>
