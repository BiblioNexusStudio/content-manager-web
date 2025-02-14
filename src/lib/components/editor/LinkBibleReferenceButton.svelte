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
    import { onMount, untrack } from 'svelte';
    import { deleteToApi, postToApi, getFromApi } from '$lib/utils/http-service';
    import { parseBibleReferences } from '../tiptap/extensions/bible-reference';
    import type { ResourceContent } from '$lib/types/resources';
    import { BibleReference, ResourceReference } from 'aquifer-tiptap';

    const isPageTransacting = getIsPageTransactingContext();

    interface Props {
        editor: Editor;
        resourceContent: ResourceContent;
        languageId: number;
    }

    $effect(() => {
        if (!isModalOpen) {
            untrack(() => {
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
            });
        }
    });

    let { editor, resourceContent, languageId }: Props = $props();

    let bibleBooksPromise: Promise<BibleBook[] | null> | null = $state(null);
    let bibleBooks: BibleBook[] | null = $state(null);

    let isTransactingAdd = $state(false);
    let isTransactingRemove = $state(false);
    let isModalOpen = $state(false);
    let existingReference = $state(false);
    let isRange = $state(false);
    let bookId = $state(0);
    let startChapter = $state(0);
    let startVerse = $state(0);
    let endChapter = $state(0);
    let endVerse = $state(0);
    let isError = $state(false);
    let updateAssociation = $state(false);

    let disabled = $derived(
        $isPageTransacting ||
            getMarkAttributes(editor.state, ResourceReference.name)?.resourceId ||
            (editor.state.selection.empty && !getMarkAttributes(editor.state, BibleReference.name)?.verses)
    );

    onMount(async () => {
        bibleBooksPromise = getFromApi<BibleBook[]>('/bibles/1/books', fetch);
        bibleBooks = await bibleBooksPromise;
    });

    let selectedBook = $derived.by(() => bibleBooks?.find((b) => b.number === bookId));
    let selectedStartChapter = $derived.by(() => selectedBook?.chapters.find((c) => c.number === startChapter));
    let selectedEndChapter = $derived.by(() => selectedBook?.chapters.find((c) => c.number === endChapter));

    let startVerseInvalid = $derived(bookId === 0 || startChapter === 0 || startVerse === 0);
    let endVerseInvalid = $derived(isRange && (endChapter === 0 || endVerse === 0));

    $inspect(selectedEndChapter);

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
        onclick={openModal}
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
                <input type="checkbox" class="mr-2" checked={isRange} onchange={toggleVerseRange} />
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
                            if (startVerse === 0) {
                                startVerse = 1;
                            }
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
                                              endChapter === startChapter && startVerse
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
    {#snippet additionalButtons()}
        {#if existingReference}
            <button disabled={isTransactingRemove} class="btn btn-error" onclick={removeLink}>
                {#if isTransactingRemove}
                    <span class="loading loading-spinner"></span>
                {:else}
                    Remove Link
                {/if}
            </button>
        {/if}
    {/snippet}
</Modal>
