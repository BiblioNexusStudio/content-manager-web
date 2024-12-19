<script lang="ts">
    import { getMarkAttributes, type Editor } from 'aquifer-tiptap';
    import Modal from '../Modal.svelte';
    import Tooltip from '../Tooltip.svelte';
    import { getIsPageTransactingContext } from '$lib/context/is-page-transacting-context';
    import { generateVerseId, parseVerseId } from '$lib/utils/bible-passage-utils';
    import BookIcon from '$lib/icons/BookIcon.svelte';
    import Select from '../Select.svelte';
    import CenteredSpinner from '../CenteredSpinner.svelte';
    import type { BibleBook } from '$lib/types/base';
    import { onMount } from 'svelte';
    import { deleteToApi, postToApi, getFromApi } from '$lib/utils/http-service';
    import { parseBibleReferences } from '../tiptap/extensions/bible-reference';
    import type { ResourceContent } from '$lib/types/resources';
    import { BibleReference, ResourceReference } from 'aquifer-tiptap';

    const isPageTransacting = getIsPageTransactingContext();
    let bibleBooksPromise: Promise<BibleBook[] | null> | null = null;
    let bibleBooks: BibleBook[] | null = null;

    $: {
        if (!isModalOpen) {
            bookId = 0;
            startChapter = 0;
            startVerse = 0;
            endChapter = 0;
            endVerse = 0;
            isRange = false;
            existingReference = false;
            updateAssociation = false;
            isTransactingAdd = false;
            isTransactingRemove = false;
            isError = false;
        }
    }

    export let resourceContent: ResourceContent;
    export let editor: Editor;
    export let languageId: number;

    let isTransactingAdd = false;
    let isTransactingRemove = false;
    let isModalOpen = false;
    let existingReference = false;
    let isRange = false;
    let bookId = 0;
    let startChapter = 0;
    let startVerse = 0;
    let endChapter = 0;
    let endVerse = 0;
    let isError = false;
    let updateAssociation = false;

    $: disabled =
        $isPageTransacting ||
        getMarkAttributes(editor.state, ResourceReference.name)?.resourceId ||
        (editor.state.selection.empty && !getMarkAttributes(editor.state, BibleReference.name)?.verses);

    $: selectedBook = bibleBooks?.find((b) => b.number === bookId);
    $: selectedStartChapter = selectedBook?.chapters.find((c) => c.number === startChapter);
    $: selectedEndChapter = selectedBook?.chapters.find((c) => c.number === endChapter);

    $: startVerseInvalid = bookId === 0 || startChapter === 0 || startVerse === 0;
    $: endVerseInvalid = isRange && (endChapter === 0 || endVerse === 0);

    onMount(async () => {
        bibleBooksPromise = getFromApi<BibleBook[]>('/bibles/1/books', fetch);
        bibleBooks = await bibleBooksPromise;
    });

    async function removeLink() {
        isTransactingRemove = true;
        isError = false;
        try {
            const currentMark = editor.getAttributes(BibleReference.name);
            if (updateAssociation) {
                await deleteIfOnlyOneReference(currentMark);
            }

            const { from, to } = editor.state.selection;
            editor
                .chain()
                .focus()
                .extendMarkRange(BibleReference.name)
                .unsetMark(BibleReference.name)
                .setTextSelection({ from, to })
                .run();

            isModalOpen = false;
        } catch {
            isError = true;
        } finally {
            isTransactingRemove = false;
        }
    }

    async function addOrUpdateLink() {
        isTransactingAdd = true;
        isError = false;
        try {
            if (!startVerseInvalid) {
                const startVerseId = generateVerseId({ bookId, chapter: startChapter, verse: startVerse });
                const endVerseId = isRange
                    ? generateVerseId({ bookId, chapter: endChapter, verse: endVerse })
                    : startVerseId;

                const currentMark = editor.getAttributes(BibleReference.name);

                if (currentMark.verses) {
                    if (updateAssociation) {
                        await Promise.all([
                            deleteIfOnlyOneReference(currentMark),
                            addReference(startVerseId, endVerseId),
                        ]);
                    }

                    const { from, to } = editor.state.selection;
                    editor
                        .chain()
                        .focus()
                        .extendMarkRange(BibleReference.name)
                        .updateAttributes(BibleReference.name, {
                            verses: [
                                {
                                    startVerse: startVerseId,
                                    endVerse: endVerseId,
                                },
                            ],
                        })
                        .setTextSelection({ from, to })
                        .run();
                } else {
                    if (updateAssociation) {
                        await addReference(startVerseId, endVerseId);
                    }

                    editor
                        .chain()
                        .focus()
                        .setMark(BibleReference.name, {
                            verses: [
                                {
                                    startVerse: startVerseId,
                                    endVerse: endVerseId,
                                },
                            ],
                        })
                        .run();
                }
            }
        } catch (e) {
            isError = true;
            throw e;
        } finally {
            isTransactingAdd = false;
        }
    }

    async function deleteIfOnlyOneReference(currentMark: ReturnType<typeof editor.getAttributes>) {
        if (languageId === 1) {
            const references = parseBibleReferences(editor.state.toJSON());
            if (
                currentMark.verses &&
                references.filter(
                    ({ startVerse, endVerse }) =>
                        startVerse.toString() === currentMark.verses[0].startVerse.toString() &&
                        endVerse.toString() === currentMark.verses[0].endVerse.toString()
                ).length === 1
            ) {
                await deleteToApi('/resources/bible-references', {
                    resourceContentId: resourceContent.resourceContentId,
                    startVerseId: parseInt(currentMark.verses[0].startVerse.toString()),
                    endVerseId: parseInt(currentMark.verses[0].endVerse.toString()),
                });
            }
        }
    }

    async function addReference(startVerseId: string, endVerseId: string) {
        if (languageId === 1) {
            await postToApi('/resources/bible-references', {
                resourceContentId: resourceContent.resourceContentId,
                startVerseId: parseInt(startVerseId),
                endVerseId: parseInt(endVerseId),
            });
        }
    }

    function referenceExistsAlready(start: string, end: string) {
        if (start === end) {
            return resourceContent.verseReferences.some((v) => v.verseId.toString() === start);
        }
        return resourceContent.passageReferences.some(
            (v) => v.startVerseId.toString() === start && v.endVerseId.toString() === end
        );
    }

    function openModal() {
        const mark = editor.getAttributes(BibleReference.name);
        if (mark.verses) {
            existingReference = true;
            const { startVerse: startVerseId, endVerse: endVerseId } = mark.verses[0];
            const parsedStart = parseVerseId(startVerseId.toString());
            const parsedEnd = parseVerseId(endVerseId.toString());
            updateAssociation =
                languageId === 1 && referenceExistsAlready(startVerseId.toString(), endVerseId.toString());
            isRange = startVerseId !== endVerseId;
            bookId = parsedStart.bookId;
            startChapter = parsedStart.chapter;
            startVerse = parsedStart.verse;
            endChapter = parsedEnd.chapter;
            endVerse = parsedEnd.verse;
        } else {
            existingReference = false;
            updateAssociation = false;
            isRange = false;
            bookId = 0;
            startChapter = 0;
            startVerse = 0;
            endChapter = 0;
            endVerse = 0;
        }
        isModalOpen = true;
    }

    function toggleVerseRange() {
        isRange = !isRange;
        endChapter = 0;
        endVerse = 0;
    }
</script>

<Tooltip
    position={{ left: '2rem', bottom: '0.2rem' }}
    class="flex border-primary align-middle text-primary"
    text="Link Bible Reference"
>
    <button
        data-app-insights-event-name="editor-toolbar-bible-reference-click"
        class="btn btn-xs px-1 {disabled && '!bg-base-200'} btn-link hover:bg-[#e6f7fc]"
        {disabled}
        on:click={openModal}
    >
        <div class="mt-[-1px] scale-[85%]">
            <BookIcon />
        </div>
    </button>
</Tooltip>

<Modal
    primaryButtonText="Add Link"
    primaryButtonOnClick={addOrUpdateLink}
    primaryButtonDisabled={startVerseInvalid || endVerseInvalid || isTransactingRemove}
    isTransacting={isTransactingAdd}
    bind:open={isModalOpen}
    header="Link Bible Reference"
>
    {#await bibleBooksPromise}
        <CenteredSpinner />
    {:then bibleBooks}
        <div class="mb-4">
            <h3 class="mb-2 flex items-center justify-between font-medium">
                Reference
                {#if isError}
                    <span class="text-xs text-error">Error occurred, try again</span>
                {/if}
            </h3>
            <div class="mb-2 flex gap-2">
                <Select
                    class="select select-bordered w-40"
                    isNumber={true}
                    options={[
                        { value: 0, label: 'Book' },
                        ...(bibleBooks || []).map((b) => ({ value: b.number, label: b.localizedName })),
                    ]}
                    bind:value={bookId}
                    onChange={() => {
                        startChapter = 0;
                        startVerse = 0;
                    }}
                />
                <Select
                    class="select select-bordered flex-grow"
                    isNumber={true}
                    options={[
                        { value: 0, label: 'Chapter' },
                        ...(selectedBook?.chapters.map((c) => ({ value: c.number, label: c.number.toString() })) || []),
                    ]}
                    disabled={!selectedBook}
                    bind:value={startChapter}
                    onChange={() => {
                        startVerse = 0;
                        if (endChapter < startChapter || (endChapter === startChapter && endVerse < startVerse)) {
                            endChapter = 0;
                            endVerse = 0;
                        }
                    }}
                />
                <Select
                    class="select select-bordered flex-grow"
                    isNumber={true}
                    options={[
                        { value: 0, label: 'Verse' },
                        ...(selectedStartChapter?.totalVerses
                            ? Array.from({ length: selectedStartChapter.totalVerses }, (_, i) => ({
                                  value: i + 1,
                                  label: (i + 1).toString(),
                              }))
                            : []),
                    ]}
                    disabled={!selectedStartChapter}
                    bind:value={startVerse}
                    onChange={() => {
                        if (endChapter < startChapter || (endChapter === startChapter && endVerse < startVerse)) {
                            endChapter = 0;
                            endVerse = 0;
                        }
                    }}
                />
            </div>
            <label class="flex items-center">
                <input type="checkbox" class="mr-2" checked={isRange} on:change={toggleVerseRange} />
                <span>Verse range</span>
            </label>
        </div>

        {#if isRange}
            <div class="mb-4">
                <div class="flex gap-2">
                    <div class="w-40"></div>
                    <Select
                        class="select select-bordered flex-grow"
                        isNumber={true}
                        options={[
                            { value: 0, label: 'Chapter' },
                            ...(selectedBook?.chapters
                                .filter((c) => c.number >= startChapter)
                                .map((c) => ({ value: c.number, label: c.number.toString() })) || []),
                        ]}
                        disabled={!selectedBook}
                        bind:value={endChapter}
                        onChange={() => {
                            endVerse = 0;
                        }}
                    />
                    <Select
                        class="select select-bordered flex-grow"
                        isNumber={true}
                        options={[
                            { value: 0, label: 'Verse' },
                            ...(selectedEndChapter?.totalVerses
                                ? Array.from(
                                      {
                                          length:
                                              endChapter === startChapter
                                                  ? selectedEndChapter.totalVerses - startVerse + 1
                                                  : selectedEndChapter.totalVerses,
                                      },
                                      (_, i) => ({
                                          value: endChapter === startChapter ? i + startVerse : i + 1,
                                          label: (endChapter === startChapter ? i + startVerse : i + 1).toString(),
                                      })
                                  )
                                : []),
                        ]}
                        disabled={!selectedEndChapter}
                        bind:value={endVerse}
                    />
                </div>
            </div>
        {/if}
        {#if languageId === 1}
            <label class="flex items-center">
                <input type="checkbox" class="mr-2" bind:checked={updateAssociation} />
                {#if existingReference}
                    <span>Update resource's Bible reference association</span>
                {:else}
                    <span>Associate Bible reference with this resource</span>
                {/if}
            </label>
        {/if}
    {/await}
    <svelte:fragment slot="additional-buttons">
        {#if existingReference}
            <button disabled={isTransactingRemove} class="btn btn-error" on:click={removeLink}>
                {#if isTransactingRemove}
                    <span class="loading loading-spinner"></span>
                {:else}
                    Remove Link
                {/if}
            </button>
        {/if}
    </svelte:fragment>
</Modal>
