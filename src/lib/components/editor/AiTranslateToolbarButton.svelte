<script lang="ts">
    import type { Editor } from '@tiptap/core';
    import { patchToApi, postToApi } from '$lib/utils/http-service';
    import type { ResourceContent } from '$lib/types/resources';

    export let editor: Editor;
    export let resourceContent: ResourceContent;
    export let isLoading: boolean;
    export let hadMachineTranslation = false;

    const onClick = async () => {
        isLoading = true;
        editor.setEditable(false);

        let html = editor.getHTML();
        let regex = /(<h\d\s|<p\s)/;
        let splits = html.split(regex);
        let chunks: string[] = [];
        for (let i = 1; i < splits.length; i = i + 2) {
            chunks.push(splits[i]! + splits[i + 1]!);
        }

        const promises = [];
        for (const key in chunks) {
            const promise = postToApi('/ai/translate', {
                languageName: resourceContent.language.englishDisplay,
                content: chunks[key],
            });

            promises.push(promise);
        }

        const responses = (await Promise.all(promises)) as unknown as { content: string }[];
        const response = responses.map((x) => x!.content).join('');

        editor.commands.setContent(response);
        editor.setEditable(true);
        isLoading = false;
        hadMachineTranslation = true;
        await patchData();
    };

    async function patchData() {
        await patchToApi(`/resources/content/${resourceContent.resourceContentId}`, {
            hadMachineTranslation,
        });
    }
</script>

<div class="divider divider-horizontal w-0" />
<button
    data-app-insights-event-name="editor-toolbar-translate-click"
    class="btn btn-link !no-animation btn-xs !bg-base-200 text-xl !no-underline"
    on:click={onClick}
    disabled={isLoading}>Translate with AI</button
>
