<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import type { AudioContentItem, ResourceContent } from '$lib/types/resources';
    import { fetchFiaAudioFromAudioContentItem, type AudioTracklist } from '$lib/components/audioPlayer/context.svelte';
    import ReplaceAudioButton from '$lib/components/audioPlayer/ReplaceAudioButton.svelte';
    import AudioPlayer from '$lib/components/audioPlayer/AudioPlayer.svelte';
    import { createAudioPlaylistContext, type AudioPlaylist } from '$lib/components/audioPlayer/context.svelte';
    import Select from '$lib/components/Select.svelte';
    import LicenseInfoButton from '../../../../routes/resources/[resourceContentId]/LicenseInfoButton.svelte';

    interface Props {
        content: AudioContentItem;
        resourceContent: ResourceContent;
    }

    let { content, resourceContent }: Props = $props();

    const versions = buildVersionSelectOptions(resourceContent);

    let playlist: AudioPlaylist = createAudioPlaylistContext();
    let selectedStepNumber = $state(1);
    let selectedVersionNumber = $state(
        versions.find((version) => version.id === resourceContent.resourceContentId)?.version || 1
    );

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

    function buildVersionSelectOptions(resourceContent: ResourceContent) {
        const versionZero = {
            version: resourceContent.versions.length ? resourceContent.versions.length + 1 : 1,
            created: resourceContent.resourceContentVersionCreated,
            id: resourceContent.resourceContentId,
            isPublished: false,
        };

        return [versionZero, ...resourceContent.versions];
    }

    function goToDifferentAudioResourcePageVersion(selectedVersionNumber: number) {
        if (!selectedVersionNumber) return;
        const selectedVersion = versions.find((version) => version.version === selectedVersionNumber)!;
        //window.location.href = `/resources/${selectedVersion.id}`;
    }

    $effect(() => {
        if (untrack(() => !playlist) || !selectedStepNumber) return;
        updateCurrentTrack();
    });

    $inspect(content, resourceContent);
</script>

<div class="flex flex-col items-start">
    <div class="mb-4">
        <Select
            bind:value={selectedVersionNumber}
            options={versions.map((version) => ({
                label: `${new Date(version.created).toLocaleDateString()} Version ${version.version}`,
                value: version.version,
            }))}
            class="select select-bordered w-lg"
            isNumber={true}
            onChange={() => {
                goToDifferentAudioResourcePageVersion(selectedVersionNumber);
            }}
        />
    </div>

    <div class="mb-4">
        <AudioPlayer audioContents={[resourceContent]} />
    </div>

    <ReplaceAudioButton />

    <LicenseInfoButton {resourceContent} />
</div>
