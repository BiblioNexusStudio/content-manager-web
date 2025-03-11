<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import type { AudioContentItem, ResourceContent } from '$lib/types/resources';
    import { fetchFiaAudioFromAudioContentItem, type AudioTracklist } from '$lib/components/audioPlayer/context.svelte';
    import ReplaceAudioButton from '$lib/components/audioPlayer/ReplaceAudioButton.svelte';
    import AudioPlayer from '$lib/components/audioPlayer/AudioPlayer.svelte';
    import AudioPlayerModal from '$lib/components/audioPlayer/AudioPlayerModal.svelte';
    import { createAudioPlaylistContext, type AudioPlaylist } from '$lib/components/audioPlayer/context.svelte';

    interface Props {
        content: AudioContentItem;
        resourceContent: ResourceContent;
    }

    let { content, resourceContent }: Props = $props();

    let zipAudioContent: AudioTracklist | [] = $state([]);
    let contentIsZipped = $derived(isZipFile(content));
    let playlist: AudioPlaylist = createAudioPlaylistContext();
    let selectedStepNumber = $state(1);

    export function isZipFile(content: AudioContentItem): boolean {
        return content.webm.url.endsWith('.zip') || content.mp3.url.endsWith('.zip');
    }

    function updateCurrentTrack() {
        if (selectedStepNumber! > playlist.currentTrackIndex + 1) {
            playlist.nextTrack();
        } else if (selectedStepNumber! < playlist.currentTrackIndex + 1) {
            playlist.prevTrack();
        }
    }

    $effect(() => {
        if (untrack(() => !playlist) || !selectedStepNumber) return;
        updateCurrentTrack();
    });

    onMount(async () => {
        if (contentIsZipped) {
            zipAudioContent = await fetchFiaAudioFromAudioContentItem(content);
        }
    });
</script>

<div class="flex flex-col items-start">
    {#if contentIsZipped}
        <div class="mb-4">
            {#each zipAudioContent as audioContent}
                <audio controls>
                    <source src={audioContent.url} type="audio/webm" />
                    Your browser does not support the audio tag.
                </audio>
            {/each}
        </div>
    {:else}
        <div class="mb-4">
            <AudioPlayer audioContents={[resourceContent]} />
        </div>
    {/if}

    <ReplaceAudioButton />
</div>
