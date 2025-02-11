<script lang="ts">
    import AudioPlayer from '$lib/components/audioPlayer/AudioPlayer.svelte';
    import { createAudioPlaylistContext, type AudioPlaylist } from '$lib/components/audioPlayer/context.svelte';
    import { Icon } from 'svelte-awesome';
    import Modal from '../Modal.svelte';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    import type { AudioContentResponse, ResourceContent } from '$lib/types/resources';
    import { onMount, untrack } from 'svelte';
    import { getFromApi } from '$lib/utils/http-service';
    import Tooltip from '../Tooltip.svelte';

    interface AudioModalProps {
        resources: AudioContentResponse[];
        selectedStepNumber: number | undefined;
    }

    let { resources, selectedStepNumber }: AudioModalProps = $props();

    let isAudioPlayerModalOpen: boolean = $state(false);
    let audioContents: ResourceContent[] | null = $state(null);
    let playlist: AudioPlaylist = createAudioPlaylistContext();

    onMount(async () => {
        if (resources.length > 0) {
            const fetchContentPromises: Promise<ResourceContent>[] = resources.map((resource) =>
                getFromApi<ResourceContent>(`/resources/content/${resource.contentId}`, fetch)
            );

            audioContents = await Promise.all(fetchContentPromises);
        }
    });

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

    $effect(() => {
        if (!playlist) return;
        if (isAudioPlayerModalOpen === false) {
            playlist.paused = true;
        }
    });
</script>

<Tooltip position={{ left: '2.5rem', top: '-0.25rem' }} class="border-primary text-primary" text="Show Audio Player">
    <button class="ml-4 flex" onclick={() => (isAudioPlayerModalOpen = !isAudioPlayerModalOpen)}>
        <Icon class="grow-0 text-primary hover:brightness-110" style="height: 18px; width: auto;" data={volumeUp} />
    </button>
</Tooltip>

<Modal bind:open={isAudioPlayerModalOpen}>
    <AudioPlayer {audioContents} />
</Modal>
