<script lang="ts">
    import type { PassageReference, VerseReference } from '$lib/types/resources';
    import { generateVerseFromReference } from '$lib/utils/reference';
    import EmptyMessage from '../EmptyMessage.svelte';
    export let bibleReferences: (PassageReference | VerseReference)[];
</script>

<div class="dropdown ms-1">
    <button
        class="btn btn-ghost ms-2 whitespace-nowrap px-1 hover:bg-[#e6f6fc]"
        data-app-insights-event-name="bible-references-menu-click"
    >
        Bible References
    </button>
    <div class="menu dropdown-content z-[1] mt-4 max-h-72 w-auto rounded-box border bg-base-100 pt-4 shadow">
        <div class="h-full overflow-y-auto bg-white px-8">
            <div class="flex w-full flex-col">
                {#each bibleReferences as bibleReference, i (i)}
                    <div class="mb-2 flex w-full justify-between">
                        <p class="whitespace-nowrap font-bold">{generateVerseFromReference(bibleReference)}</p>
                    </div>
                {:else}
                    <EmptyMessage message="No bible references" />
                {/each}
            </div>
        </div>
    </div>
</div>
