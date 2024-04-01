<script lang="ts">
    import type { Editor } from '@tiptap/core';
    import type { ResourceContent } from '$lib/types/resources';
    import { postToApi } from '$lib/utils/http-service';

    export let editor: Editor;
    export let resourceContent: ResourceContent;

    let working = false;

    const onClick = async () => {
        working = true;
        editor.setEditable(false);

        let html = editor.getHTML();
        let regex = /(<h\d\s|<p\s)/;
        let splits = html.split(regex);
        let chunks: { order: number; content: string }[] = [];
        for (let i = 1; i < splits.length; i = i + 2) {
            chunks.push({ order: i, content: splits[i]! + splits[i + 1]! });
        }

        const promises = [];
        for (const key in chunks) {
            const promise = postToApi('/ai/translate', {
                languageName: resourceContent.language.englishDisplay,
                content: chunks[key]!.content,
            });

            promises.push(promise);
        }

        const responses = await Promise.all(promises);
        for (const key in responses) {
            console.log(responses[key]);
        }

        const response = responses.map((x) => x.content).join('');
        console.log(response);

        editor.commands.setContent(response);
        editor.setEditable(true);
        working = false;
    };
</script>

<div class="divider divider-horizontal w-0" />
<button class="btn btn-link !no-animation btn-xs !bg-base-200 !no-underline" on:click={onClick} disabled={working}
    >{#if working}<div class="loading loading-spinner loading-xs" />{:else}Translate with AI{/if}</button
>
