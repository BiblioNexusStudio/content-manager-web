<script lang="ts">
    import type { HelpDocumentResponse } from '$lib/types/helpDocuments';
    import { fly } from 'svelte/transition';
    import List from './List.svelte';
    import Title from './Title.svelte';

    export let helpDocuments: HelpDocumentResponse;
    export let isShowHelpModal: boolean;

    function close() {
        isShowHelpModal = false;
    }
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

    <section class="mb-4">
        <Title>Recent Releases</Title>
        <List documents={helpDocuments.releases} />
    </section>

    <section class="mb-4">
        <Title>How-To</Title>
        <List documents={helpDocuments.howTos} />
    </section>
</div>
