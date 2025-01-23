<script lang="ts">
    import AudioPlayer from '$lib/components/audioPlayer/AudioPlayer.svelte';
    import { setAudioPlaylistContext, type AudioPlaylist } from '$lib/components/audioPlayer/context.svelte';
    import { Icon } from 'svelte-awesome';
    import Modal from '../Modal.svelte';
    import volumeUp from 'svelte-awesome/icons/volumeUp';
    // TODO accept audio info for the audio player
    // this will be the wraper to handle playlist management for a resource,
    // it will also handle FIA content steps and state management
    // When 'selectedStep' changes, grab snapshot of audio player state ( track and current time )

    // have to prep playlist wher you want to use the audio player
    // preferred media types like webm should be listed first and the fall back last
    let playlist: AudioPlaylist = $state({
        currentTrack: 0,
        paused: true,
        tracks: [
            [
                {
                    url: 'https://cdn.aquifer.bible/aquifer-content/scripture/ENG/BSB/audio/webm/ENG_BSB_42_001.webm',
                    type: 'webm',
                    currentTime: 0,
                },
                {
                    url: 'https://cdn.aquifer.bible/aquifer-content/scripture/ENG/BSB/audio/webm/ENG_BSB_42_001.mp3',
                    type: 'mp3',
                    currentTime: 0,
                },
            ],
            [
                {
                    url: 'https://cdn.aquifer.bible/aquifer-content/scripture/ENG/BSB/audio/webm/ENG_BSB_42_002.webm',
                    type: 'webm',
                    currentTime: 0,
                },
                {
                    url: 'https://cdn.aquifer.bible/aquifer-content/scripture/ENG/BSB/audio/webm/ENG_BSB_42_002.mp3',
                    type: 'mp3',
                    currentTime: 0,
                },
            ],
            [
                {
                    url: 'https://cdn.aquifer.bible/aquifer-content/scripture/ENG/BSB/audio/webm/ENG_BSB_42_003.webm',
                    type: 'webm',
                    currentTime: 0,
                },
                {
                    url: 'https://cdn.aquifer.bible/aquifer-content/scripture/ENG/BSB/audio/webm/ENG_BSB_42_003.mp3',
                    type: 'mp3',
                    currentTime: 0,
                },
            ],
        ],
    });

    setAudioPlaylistContext(playlist);

    let isAudioPlayerModalOpen = $state(false);

    $effect(() => {
        if (isAudioPlayerModalOpen === false) {
            playlist.paused = true;
        }
    });
</script>

<button class="ml-4 flex" onclick={() => (isAudioPlayerModalOpen = !isAudioPlayerModalOpen)}>
    <Icon class="grow-0 text-primary hover:brightness-110" style="height: 18px; width: auto;" data={volumeUp} />
</button>

<Modal bind:open={isAudioPlayerModalOpen}>
    <AudioPlayer />
</Modal>
